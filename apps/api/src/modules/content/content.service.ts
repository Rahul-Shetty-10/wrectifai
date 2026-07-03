import { ensureAuthSchema, query } from '../../config/db';

type PayloadRow<T = unknown> = {
  payload: T;
};

async function payloads<T>(sql: string) {
  await ensureAuthSchema();
  const result = await query<PayloadRow<T>>(sql);
  return result.rows.map((row) => row.payload);
}

async function contentGroup<T>(key: string, fallback: T) {
  await ensureAuthSchema();
  const result = await query<PayloadRow<T>>(
    'SELECT payload FROM screen_content_groups WHERE key = $1 LIMIT 1',
    [key]
  );
  return result.rows[0]?.payload ?? fallback;
}

export async function getDashboardData() {
  const [
    categoryItems,
    maintenanceItems,
    featuredGarages,
    seasonalDeals,
    careTips,
    overviewItems,
    emergencyItems,
    promoItems,
    topNavIcons,
  ] = await Promise.all([
    payloads('SELECT payload FROM screen_category_items ORDER BY "sortOrder"'),
    payloads('SELECT payload FROM screen_maintenance_items ORDER BY "sortOrder"'),
    payloads('SELECT payload FROM screen_featured_garages ORDER BY "sortOrder"'),
    contentGroup('home-seasonal-deals', []),
    payloads('SELECT payload FROM screen_care_tips ORDER BY "sortOrder"'),
    payloads('SELECT payload FROM screen_dashboard_overview_items ORDER BY "sortOrder"'),
    payloads('SELECT payload FROM screen_emergency_items ORDER BY "sortOrder"'),
    payloads('SELECT payload FROM screen_promo_items ORDER BY "sortOrder"'),
    contentGroup('top-nav-icons', []),
  ]);

  return {
    categoryItems,
    maintenanceItems,
    garages: featuredGarages,
    seasonalDeals,
    careTips,
    overviewItems,
    emergencyItems,
    promoItems,
    topNavIcons,
  };
}

export async function getGaragesData() {
  const [garages, filterOptions, filterPills, sortOptions] = await Promise.all([
    payloads('SELECT payload FROM screen_garage_cards ORDER BY name'),
    query<{
      filterKey: string;
      value: string;
      label: string;
      payload: unknown;
    }>(
      'SELECT "filterKey", value, label, payload FROM screen_garage_filter_options ORDER BY "filterKey", "sortOrder"'
    ),
    contentGroup('garage-filter-pills', []),
    contentGroup('garage-sort-options', []),
  ]);

  return {
    garages,
    filterPills,
    sortOptions,
    filterOptions: filterOptions.rows.reduce<Record<string, unknown[]>>(
      (accumulator, row) => {
        accumulator[row.filterKey] ??= [];
        accumulator[row.filterKey].push(row.payload);
        return accumulator;
      },
      {}
    ),
  };
}

export async function getDealsData() {
  const [deals, dealFilters, filterOptions] = await Promise.all([
    payloads('SELECT payload FROM screen_deals ORDER BY relevance DESC, title'),
    payloads('SELECT payload FROM screen_deal_filter_options ORDER BY "sortOrder"'),
    contentGroup('deal-filter-options', {}),
  ]);

  return { deals, dealFilters, filterOptions };
}

export async function getQuotesData() {
  const [quotesList, priceRows, detailRows, actionItems, defaults] =
    await Promise.all([
      payloads('SELECT payload FROM screen_quote_cards ORDER BY "_id"'),
      payloads(
        'SELECT payload FROM screen_quote_comparison_rows WHERE section = \'price\' ORDER BY "sortOrder"'
      ),
      payloads(
        'SELECT payload FROM screen_quote_comparison_rows WHERE section = \'detail\' ORDER BY "sortOrder"'
      ),
      contentGroup('quote-action-items', []),
      contentGroup('quote-context-defaults', {}),
    ]);

  return { quotesList, priceRows, detailRows, actionItems, defaults };
}

export async function getDiagnosisCatalogData() {
  const [categories, settings] = await Promise.all([
    payloads('SELECT payload FROM screen_diagnosis_categories ORDER BY label'),
    contentGroup('diagnosis-settings', {}),
  ]);

  return { issueCategories: categories, settings };
}
