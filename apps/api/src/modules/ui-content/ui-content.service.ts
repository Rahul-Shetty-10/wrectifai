import { query } from '../../db/postgres';
import { validateAuthPageContent } from './ui-content.validation';
import { validateUserContent } from './ui-content.validation';
import type { AuthPage, UIContentQueryInput } from './ui-content.types';

type DBRow = { content: unknown };

export async function getUIContent(input: UIContentQueryInput) {
  const tenantId = input.tenantId?.trim() || 'default';
  const locale = input.locale?.trim() || 'en-US';

  const sql = `
    SELECT content
    FROM ui_content
    WHERE tenant_id = $1
      AND module = $2
      AND page = $3
      AND locale = $4
    LIMIT 1
  `;

  const exact = await query<DBRow>(sql, [tenantId, input.module, input.page, locale]);
  const content = exact.rows[0]?.content;

  if (content !== undefined) {
    return validateContent(input.module, input.page, content);
  }

  const fallback = await query<DBRow>(sql, [tenantId, input.module, input.page, 'en-US']);
  const fallbackContent = fallback.rows[0]?.content;

  if (fallbackContent !== undefined) {
    return validateContent(input.module, input.page, fallbackContent);
  }

  return {};
}

function validateContent(module: string, page: string, content: unknown) {
  if (module === 'auth') {
    if (page !== 'login' && page !== 'register' && page !== 'verify') {
      throw new Error(`Invalid auth page requested: ${page}`);
    }
    const ok = validateAuthPageContent(page as AuthPage, content);
    if (!ok) {
      throw new Error(`Invalid ui_content JSON shape for auth/${page}`);
    }
    return content;
  }

  if (module === 'user') {
    const ok = validateUserContent(page, content);
    if (!ok) {
      throw new Error(`Invalid ui_content JSON shape for user/${page}`);
    }
    return content;
  }

  return content;
}
