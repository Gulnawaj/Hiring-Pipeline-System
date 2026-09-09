import { Application } from '../models/Application.js';

export const exportApplications = async (req, res) => {
  try {
    const applications = await Application.find({
      is_rejected: 0,
    })
      .populate('job_opening_id', 'title department status')
      .sort({ created_at: 1 })
      .lean();

    const escapeCsv = (value) => {
      if (value === null || value === undefined) return '';

      const text = String(value);

      // Escape values containing commas, quotes, or newlines.
      if (/[",\n\r]/.test(text)) {
        return `"${text.replace(/"/g, '""')}"`;
      }

      return text;
    };

    const rows = [
      [
        'Application ID',
        'Candidate Name',
        'Candidate Email',
        'Job Opening',
        'Department',
        'Source',
        'Current Stage',
      ],
    ];

    for (const app of applications) {
      rows.push([
        app._id?.toString() || '',
        app.candidate_name || '',
        app.candidate_email || '',
        app.job_opening_id?.title || '',
        app.job_opening_id?.department || '',
        app.source || '',
        app.stage || '',
      ]);
    }

    const csv = rows
      .map((row) => row.map(escapeCsv).join(','))
      .join('\r\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="pipeline-snapshot.csv"'
    );

    res.status(200).send(csv);
  } catch (err) {
    console.error('Error exporting pipeline snapshot:', err);
    res.status(500).json({
      error: 'Failed to export pipeline snapshot',
    });
  }
};
