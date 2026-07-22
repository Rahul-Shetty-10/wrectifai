import { query } from '../../config/database';

export interface RetrievedIssue {
  id: string;
  category: string;
  issue_name: string;
  description: string;
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  diy_allowed: boolean;
  safety_critical: boolean;
  required_parts: { name: string; category: string }[];
  estimated_cost_min: number;
  estimated_cost_max: number;
  diy_steps: string[];
  garage_steps: string[];
  base_confidence: number;
}

export class KnowledgeService {
  /**
   * Retrieve matching known issues for a given symptom text and optional vehicle.
   * Returns matches ordered by relevance score.
   */
  static async findMatchingIssues(
    symptomText: string,
    vehicleMake?: string,
    vehicleYear?: number,
    category?: string,
    maxResults = 5
  ): Promise<RetrievedIssue[]> {
    // Process input text: keep alphanumeric and spaces, split into words
    const tokens = symptomText
      .replace(/[^a-zA-Z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 1);

    if (tokens.length === 0) {
      return [];
    }

    // Convert tokens to FTS OR query with prefix matching, e.g. "click:* | nois:*"
    // ponytail: leverage native postgres to_tsquery/to_tsvector for stemming/stop-words
    const tsQuery = tokens.map(t => `${t}:*`).join(' | ');

    const queryText = `
      WITH scored_issues AS (
        SELECT *,
               ts_rank_cd(
                 to_tsvector('english', 
                   coalesce(issue_name, '') || ' ' || 
                   coalesce(description, '') || ' ' || 
                   coalesce(array_to_string(symptom_keywords, ' '), '')
                 ),
                 to_tsquery('english', $1)
               ) as match_count
        FROM known_issues
        WHERE 
          -- Category filtering (if provided)
          ($4::varchar IS NULL OR category = $4)
          -- Make applicability
          AND ($2::varchar IS NULL OR makes IS NULL OR exists (select 1 from unnest(makes) m where lower(m) = lower($2)))
          -- Year applicability
          AND ($3::integer IS NULL OR (
            (year_from IS NULL OR year_from <= $3) AND 
            (year_to IS NULL OR year_to >= $3)
          ))
      )
      SELECT * FROM scored_issues
      WHERE match_count > 0
      ORDER BY match_count DESC, base_confidence DESC
      LIMIT $5
    `;

    const makeParam = vehicleMake || null;
    const yearParam = vehicleYear || null;
    const categoryParam = category || null;

    const res = await query(queryText, [tsQuery, makeParam, yearParam, categoryParam, maxResults]);

    return res.rows.map(row => ({
      id: row.id,
      category: row.category,
      issue_name: row.issue_name,
      description: row.description,
      risk_level: row.risk_level,
      diy_allowed: row.diy_allowed,
      safety_critical: row.safety_critical,
      required_parts: Array.isArray(row.required_parts) ? row.required_parts : [],
      estimated_cost_min: parseFloat(row.estimated_cost_min),
      estimated_cost_max: parseFloat(row.estimated_cost_max),
      diy_steps: Array.isArray(row.diy_steps) ? row.diy_steps : [],
      garage_steps: Array.isArray(row.garage_steps) ? row.garage_steps : [],
      base_confidence: parseFloat(row.base_confidence)
    }));
  }
}
