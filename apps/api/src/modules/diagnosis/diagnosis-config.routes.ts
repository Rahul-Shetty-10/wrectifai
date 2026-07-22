import { Router } from 'express';
import { success, error } from '../../utils/response';
import { query } from '../../config/database';

export const diagnoseConfigRouter = Router();

// Get all issue categories with their questions and possible issues
diagnoseConfigRouter.get('/categories', async (_req, res) => {
  try {
    const categoriesResult = await query(
      'SELECT * FROM diagnose_issue_categories ORDER BY sort_order'
    );

    const categories = await Promise.all(
      categoriesResult.rows.map(async (category: any) => {
        const [questionsResult, issuesResult] = await Promise.all([
          query(
            'SELECT * FROM diagnose_questions WHERE category_id = $1 ORDER BY sort_order',
            [category.id]
          ),
          query(
            'SELECT * FROM diagnose_possible_issues WHERE category_id = $1 ORDER BY sort_order',
            [category.id]
          ),
        ]);

        return {
          id: category.id,
          label: category.label,
          summary: category.summary,
          summaryMeaning: category.summary_meaning,
          keywords: category.keywords,
          questions: questionsResult.rows.map((q: any) => ({
            id: q.id,
            label: q.label,
            question: q.question,
            options: q.options,
          })),
          possibleIssues: issuesResult.rows.map((i: any) => ({
            id: i.id,
            title: i.title,
            badge: i.badge,
            badgeClass: i.badge_class,
            description: i.description,
            match: i.match_score,
            risks: i.risks,
            estimatedCost: i.estimated_cost,
            imageSrc: i.image_src,
          })),
        };
      })
    );

    return success(res, categories);
  } catch (err) {
    return error(
      res,
      err instanceof Error ? err.message : 'Failed to fetch diagnose categories',
      'DATABASE_ERROR',
      500
    );
  }
});

// Get single category by ID
diagnoseConfigRouter.get('/categories/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const categoryResult = await query(
      'SELECT * FROM diagnose_issue_categories WHERE id = $1',
      [id]
    );

    if (categoryResult.rows.length === 0) {
      return error(res, 'Category not found', 'NOT_FOUND', 404);
    }

    const category = categoryResult.rows[0];

    const [questionsResult, issuesResult] = await Promise.all([
      query(
        'SELECT * FROM diagnose_questions WHERE category_id = $1 ORDER BY sort_order',
        [id]
      ),
      query(
        'SELECT * FROM diagnose_possible_issues WHERE category_id = $1 ORDER BY sort_order',
        [id]
      ),
    ]);

    return success(res, {
      id: category.id,
      label: category.label,
      summary: category.summary,
      summaryMeaning: category.summary_meaning,
      keywords: category.keywords,
      questions: questionsResult.rows.map((q: any) => ({
        id: q.id,
        label: q.label,
        question: q.question,
        options: q.options,
      })),
      possibleIssues: issuesResult.rows.map((i: any) => ({
        id: i.id,
        title: i.title,
        badge: i.badge,
        badgeClass: i.badge_class,
        description: i.description,
        match: i.match_score,
        risks: i.risks,
        estimatedCost: i.estimated_cost,
        imageSrc: i.image_src,
      })),
    });
  } catch (err) {
    return error(
      res,
      err instanceof Error ? err.message : 'Failed to fetch category',
      'DATABASE_ERROR',
      500
    );
  }
});

// Get result summary items
diagnoseConfigRouter.get('/result-summaries', async (_req, res) => {
  try {
    const result = await query(
      'SELECT * FROM diagnose_result_summaries ORDER BY sort_order'
    );

    const items = result.rows.map((row: any) => ({
      title: row.title,
      heading: row.heading,
      body: row.body,
      pill: row.pill,
      pillClass: row.pill_class,
      icon: row.icon,
      iconClass: row.icon_class,
    }));

    return success(res, items);
  } catch (err) {
    return error(
      res,
      err instanceof Error ? err.message : 'Failed to fetch result summaries',
      'DATABASE_ERROR',
      500
    );
  }
});

// Get next steps
diagnoseConfigRouter.get('/next-steps', async (_req, res) => {
  try {
    const result = await query(
      'SELECT * FROM diagnose_next_steps ORDER BY sort_order'
    );

    const steps = result.rows.map((row: any) => ({
      step: row.step_number,
      title: row.title,
      body: row.body,
      meta: row.meta,
    }));

    return success(res, steps);
  } catch (err) {
    return error(
      res,
      err instanceof Error ? err.message : 'Failed to fetch next steps',
      'DATABASE_ERROR',
      500
    );
  }
});

// Get trust items
diagnoseConfigRouter.get('/trust-items', async (_req, res) => {
  try {
    const result = await query(
      'SELECT * FROM diagnose_trust_items ORDER BY sort_order'
    );

    return success(res, result.rows);
  } catch (err) {
    return error(
      res,
      err instanceof Error ? err.message : 'Failed to fetch trust items',
      'DATABASE_ERROR',
      500
    );
  }
});

// Get all diagnose config in one call (for initial page load)
diagnoseConfigRouter.get('/all', async (_req, res) => {
  try {
    const [categoriesResult, summariesResult, nextStepsResult, trustResult] =
      await Promise.all([
        query('SELECT * FROM diagnose_issue_categories ORDER BY sort_order'),
        query('SELECT * FROM diagnose_result_summaries ORDER BY sort_order'),
        query('SELECT * FROM diagnose_next_steps ORDER BY sort_order'),
        query('SELECT * FROM diagnose_trust_items ORDER BY sort_order'),
      ]);

    const categories = await Promise.all(
      categoriesResult.rows.map(async (category: any) => {
        const [questionsResult, issuesResult] = await Promise.all([
          query(
            'SELECT * FROM diagnose_questions WHERE category_id = $1 ORDER BY sort_order',
            [category.id]
          ),
          query(
            'SELECT * FROM diagnose_possible_issues WHERE category_id = $1 ORDER BY sort_order',
            [category.id]
          ),
        ]);

        return {
          id: category.id,
          label: category.label,
          summary: category.summary,
          summaryMeaning: category.summary_meaning,
          keywords: category.keywords,
          questions: questionsResult.rows.map((q: any) => ({
            id: q.id,
            label: q.label,
            question: q.question,
            options: q.options,
          })),
          possibleIssues: issuesResult.rows.map((i: any) => ({
            id: i.id,
            title: i.title,
            badge: i.badge,
            badgeClass: i.badge_class,
            description: i.description,
            match: i.match_score,
            risks: i.risks,
            estimatedCost: i.estimated_cost,
            imageSrc: i.image_src,
          })),
        };
      })
    );

    return success(res, {
      categories,
      resultSummaries: summariesResult.rows.map((row: any) => ({
        title: row.title,
        heading: row.heading,
        body: row.body,
        pill: row.pill,
        pillClass: row.pill_class,
        icon: row.icon,
        iconClass: row.icon_class,
      })),
      nextSteps: nextStepsResult.rows.map((row: any) => ({
        step: row.step_number,
        title: row.title,
        body: row.body,
        meta: row.meta,
      })),
      trustItems: trustResult.rows,
    });
  } catch (err) {
    return error(
      res,
      err instanceof Error ? err.message : 'Failed to fetch diagnose config',
      'DATABASE_ERROR',
      500
    );
  }
});
