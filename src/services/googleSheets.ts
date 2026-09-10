import { ChapterProgress, SubjectId, PaperId } from '../types';
import { calculateChapterAverage } from './initialData';

export interface SheetSearchItem {
  id: string;
  name: string;
  webViewLink?: string;
  modifiedTime?: string;
}

export const PAPER_SHEET_NAMES: Record<string, string> = {
  'physics_1st': 'Physics 1st Paper',
  'physics_2nd': 'Physics 2nd Paper',
  'higher_math_1st': 'Higher Math 1st Paper',
  'higher_math_2nd': 'Higher Math 2nd Paper',
};

const getPaperKey = (subject: SubjectId, paper: PaperId): string => `${subject}_${paper}`;

/**
 * Transforms an array of ChapterProgress items into 2D table rows matching the user's Google Sheet format.
 * The Chapter column spans 3 columns (A, B, C) to prevent text collision with exam marks,
 * and Notes is omitted.
 */
export function chaptersToSheetRows(
  subjectTitle: string,
  chapters: ChapterProgress[]
): (string | number)[][] {
  const rows: (string | number)[][] = [
    [`${subjectTitle} - Chapter Progress Tracker`, '', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', '', ''],
    [
      'Chapter',
      '',
      '',
      'Exam-1',
      'Exam-2',
      'Exam-3',
      'Average (%)',
      'Current Week',
      'Status',
    ],
  ];

  for (const ch of chapters) {
    const exam1 = ch.exam1 !== null ? ch.exam1 : '';
    const exam2 = ch.exam2 !== null ? ch.exam2 : '';
    const exam3 = ch.exam3 !== null ? ch.exam3 : '';
    const avg = ch.average !== null ? ch.average : '';
    const currentWeek = ch.isCurrentWeek ? 'TRUE' : 'FALSE';
    const statusText =
      ch.status === 'completed'
        ? 'Completed'
        : ch.status === 'in_progress'
        ? 'In Progress'
        : ch.status === 'revision'
        ? 'Revision'
        : 'Not Started';

    rows.push([
      ch.nameBn || ch.nameEn,
      '',
      '',
      exam1,
      exam2,
      exam3,
      avg,
      currentWeek,
      statusText,
    ]);
  }

  return rows;
}

/**
 * Search Drive for existing HSC Admission progress spreadsheets
 */
export async function findExistingSheets(accessToken: string): Promise<SheetSearchItem[]> {
  try {
    const q = encodeURIComponent(
      "mimeType='application/vnd.google-apps.spreadsheet' and trashed=false"
    );
    const url = `https://www.googleapis.com/drive/v3/files?q=${q}&orderBy=modifiedTime desc&pageSize=20&fields=files(id,name,webViewLink,modifiedTime)`;
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error?.message || `Failed to search Drive (${res.status})`);
    }

    const data = await res.json();
    return data.files || [];
  } catch (err: any) {
    console.error('Error finding existing sheets:', err);
    throw err;
  }
}

/**
 * Creates a brand new Google Spreadsheet configured with all 8 papers as separate sheets.
 */
export async function createProgressSpreadsheet(
  accessToken: string,
  allChapters: ChapterProgress[],
  title = 'Track The Journey - Academic & Admission Progress Tracker'
): Promise<{ id: string; url: string }> {
  try {
    const sheetsToCreate = [
      { properties: { title: 'Physics 1st Paper', gridProperties: { rowCount: 40, columnCount: 15 } } },
      { properties: { title: 'Physics 2nd Paper', gridProperties: { rowCount: 40, columnCount: 15 } } },
      { properties: { title: 'Chemistry 1st Paper', gridProperties: { rowCount: 40, columnCount: 15 } } },
      { properties: { title: 'Chemistry 2nd Paper', gridProperties: { rowCount: 40, columnCount: 15 } } },
      { properties: { title: 'Higher Math 1st Paper', gridProperties: { rowCount: 40, columnCount: 15 } } },
      { properties: { title: 'Higher Math 2nd Paper', gridProperties: { rowCount: 40, columnCount: 15 } } },
      { properties: { title: 'Biology 1st Paper', gridProperties: { rowCount: 40, columnCount: 15 } } },
      { properties: { title: 'Biology 2nd Paper', gridProperties: { rowCount: 40, columnCount: 15 } } },
    ];

    const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        properties: { title },
        sheets: sheetsToCreate,
      }),
    });

    if (!createRes.ok) {
      const err = await createRes.json().catch(() => ({}));
      throw new Error(err?.error?.message || `Failed to create spreadsheet (${createRes.status})`);
    }

    const spreadsheet = await createRes.json();
    const spreadsheetId = spreadsheet.spreadsheetId;
    const spreadsheetUrl =
      spreadsheet.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;

    // Now populate initial values and styling into each sheet tab
    await syncAllChaptersToSpreadsheet(accessToken, spreadsheetId, allChapters);

    return { id: spreadsheetId, url: spreadsheetUrl };
  } catch (err: any) {
    console.error('Error creating spreadsheet:', err);
    throw err;
  }
}

/**
 * Syncs all 8 papers to the specified Google Spreadsheet.
 * Formats the Chapter column to span 3 columns (A, B, C) to prevent text collision,
 * centers exam marks and stats, sets clean column widths, and omits the Notes column.
 */
export async function syncAllChaptersToSpreadsheet(
  accessToken: string,
  spreadsheetId: string,
  allChapters: ChapterProgress[]
): Promise<void> {
  const paperConfigs: { key: string; subject: SubjectId; paper: PaperId; title: string; sheetName: string }[] = [
    { key: 'physics_1st', subject: 'physics', paper: '1st', title: 'Physics 1st Paper', sheetName: 'Physics 1st Paper' },
    { key: 'physics_2nd', subject: 'physics', paper: '2nd', title: 'Physics 2nd Paper', sheetName: 'Physics 2nd Paper' },
    { key: 'chemistry_1st', subject: 'chemistry', paper: '1st', title: 'Chemistry 1st Paper', sheetName: 'Chemistry 1st Paper' },
    { key: 'chemistry_2nd', subject: 'chemistry', paper: '2nd', title: 'Chemistry 2nd Paper', sheetName: 'Chemistry 2nd Paper' },
    { key: 'higher_math_1st', subject: 'higher_math', paper: '1st', title: 'Higher Math 1st Paper', sheetName: 'Higher Math 1st Paper' },
    { key: 'higher_math_2nd', subject: 'higher_math', paper: '2nd', title: 'Higher Math 2nd Paper', sheetName: 'Higher Math 2nd Paper' },
    { key: 'biology_1st', subject: 'biology', paper: '1st', title: 'Biology 1st Paper', sheetName: 'Biology 1st Paper' },
    { key: 'biology_2nd', subject: 'biology', paper: '2nd', title: 'Biology 2nd Paper', sheetName: 'Biology 2nd Paper' },
  ];

  const dataPayload: { range: string; values: (string | number)[][] }[] = [];

  for (const config of paperConfigs) {
    const subset = allChapters.filter(
      (c) => c.subject === config.subject && c.paper === config.paper
    );
    const rows = chaptersToSheetRows(config.title, subset);
    dataPayload.push({
      range: `'${config.sheetName}'!A1:I${rows.length}`,
      values: rows,
    });
  }

  // 1. Update data values
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      valueInputOption: 'USER_ENTERED',
      data: dataPayload,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Failed to update spreadsheet (${res.status})`);
  }

  // 2. Fetch sheet metadata to obtain sheetId for formatting & merging
  let sheetMetadata: { sheetId: number; title: string }[] = [];
  try {
    const metaRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=sheets(properties(sheetId,title))`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    if (metaRes.ok) {
      const metaData = await metaRes.json();
      sheetMetadata = (metaData.sheets || []).map((s: any) => ({
        sheetId: s.properties.sheetId,
        title: s.properties.title,
      }));
    }
  } catch (e) {
    console.warn('Could not fetch sheet metadata for formatting', e);
  }

  // 3. Prepare formatting, cell merging, and column widths requests
  const formatRequests: any[] = [];

  for (const config of paperConfigs) {
    const matched = sheetMetadata.find(
      (m) =>
        m.title.toLowerCase().trim() === config.sheetName.toLowerCase().trim() ||
        m.title.toLowerCase().includes(config.title.toLowerCase())
    );
    if (!matched) continue;

    const sId = matched.sheetId;
    const subset = allChapters.filter(
      (c) => c.subject === config.subject && c.paper === config.paper
    );
    const totalRows = subset.length + 3; // 1 title + 1 blank + 1 header + chapters

    // Unmerge existing cells to prevent overlap errors
    formatRequests.push({
      unmergeCells: {
        range: {
          sheetId: sId,
          startRowIndex: 0,
          endRowIndex: totalRows,
          startColumnIndex: 0,
          endColumnIndex: 9,
        },
      },
    });

    // Merge Title row (A1:I1)
    formatRequests.push({
      mergeCells: {
        range: {
          sheetId: sId,
          startRowIndex: 0,
          endRowIndex: 1,
          startColumnIndex: 0,
          endColumnIndex: 9,
        },
        mergeType: 'MERGE_ALL',
      },
    });

    // Merge Chapter columns (A to C) for each row from Header (row 3, index 2) to end of chapters
    formatRequests.push({
      mergeCells: {
        range: {
          sheetId: sId,
          startRowIndex: 2,
          endRowIndex: totalRows,
          startColumnIndex: 0,
          endColumnIndex: 3,
        },
        mergeType: 'MERGE_ROWS',
      },
    });

    // Title row formatting (A1)
    formatRequests.push({
      repeatCell: {
        range: {
          sheetId: sId,
          startRowIndex: 0,
          endRowIndex: 1,
          startColumnIndex: 0,
          endColumnIndex: 9,
        },
        cell: {
          userEnteredFormat: {
            textFormat: { bold: true, fontSize: 11 },
            horizontalAlignment: 'LEFT',
            verticalAlignment: 'MIDDLE',
          },
        },
        fields: 'userEnteredFormat(textFormat,horizontalAlignment,verticalAlignment)',
      },
    });

    // Header row formatting (A3:I3 -> index 2 to 3)
    formatRequests.push({
      repeatCell: {
        range: {
          sheetId: sId,
          startRowIndex: 2,
          endRowIndex: 3,
          startColumnIndex: 0,
          endColumnIndex: 9,
        },
        cell: {
          userEnteredFormat: {
            textFormat: { bold: true },
            backgroundColor: { red: 0.945, green: 0.961, blue: 0.976 },
            horizontalAlignment: 'CENTER',
            verticalAlignment: 'MIDDLE',
          },
        },
        fields: 'userEnteredFormat(textFormat,backgroundColor,horizontalAlignment,verticalAlignment)',
      },
    });

    // Chapter header cell (A3:C3) left-aligned
    formatRequests.push({
      repeatCell: {
        range: {
          sheetId: sId,
          startRowIndex: 2,
          endRowIndex: 3,
          startColumnIndex: 0,
          endColumnIndex: 3,
        },
        cell: {
          userEnteredFormat: {
            textFormat: { bold: true },
            backgroundColor: { red: 0.945, green: 0.961, blue: 0.976 },
            horizontalAlignment: 'LEFT',
            verticalAlignment: 'MIDDLE',
          },
        },
        fields: 'userEnteredFormat(textFormat,backgroundColor,horizontalAlignment,verticalAlignment)',
      },
    });

    // Chapter data rows (Cols 0-3, rows 3 to totalRows) - Left aligned
    formatRequests.push({
      repeatCell: {
        range: {
          sheetId: sId,
          startRowIndex: 3,
          endRowIndex: totalRows,
          startColumnIndex: 0,
          endColumnIndex: 3,
        },
        cell: {
          userEnteredFormat: {
            horizontalAlignment: 'LEFT',
            verticalAlignment: 'MIDDLE',
          },
        },
        fields: 'userEnteredFormat(horizontalAlignment,verticalAlignment)',
      },
    });

    // Exam marks & stats rows (Cols 3-9: Exam-1, Exam-2, Exam-3, Average, Current Week, Status) - Center aligned
    formatRequests.push({
      repeatCell: {
        range: {
          sheetId: sId,
          startRowIndex: 3,
          endRowIndex: totalRows,
          startColumnIndex: 3,
          endColumnIndex: 9,
        },
        cell: {
          userEnteredFormat: {
            horizontalAlignment: 'CENTER',
            verticalAlignment: 'MIDDLE',
          },
        },
        fields: 'userEnteredFormat(horizontalAlignment,verticalAlignment)',
      },
    });

    // Column widths:
    // Columns A, B, C (0, 1, 2) set to 120px each (Total = 360px wide for chapter name)
    formatRequests.push({
      updateDimensionProperties: {
        range: {
          sheetId: sId,
          dimension: 'COLUMNS',
          startIndex: 0,
          endIndex: 3,
        },
        properties: { pixelSize: 120 },
        fields: 'pixelSize',
      },
    });

    // Columns D, E, F (Exam-1, Exam-2, Exam-3) set to 85px
    formatRequests.push({
      updateDimensionProperties: {
        range: {
          sheetId: sId,
          dimension: 'COLUMNS',
          startIndex: 3,
          endIndex: 6,
        },
        properties: { pixelSize: 85 },
        fields: 'pixelSize',
      },
    });

    // Column G (Average (%)) set to 95px
    formatRequests.push({
      updateDimensionProperties: {
        range: {
          sheetId: sId,
          dimension: 'COLUMNS',
          startIndex: 6,
          endIndex: 7,
        },
        properties: { pixelSize: 95 },
        fields: 'pixelSize',
      },
    });

    // Column H (Current Week) set to 105px
    formatRequests.push({
      updateDimensionProperties: {
        range: {
          sheetId: sId,
          dimension: 'COLUMNS',
          startIndex: 7,
          endIndex: 8,
        },
        properties: { pixelSize: 105 },
        fields: 'pixelSize',
      },
    });

    // Column I (Status) set to 110px
    formatRequests.push({
      updateDimensionProperties: {
        range: {
          sheetId: sId,
          dimension: 'COLUMNS',
          startIndex: 8,
          endIndex: 9,
        },
        properties: { pixelSize: 110 },
        fields: 'pixelSize',
      },
    });
  }

  // 4. Send batch formatting requests
  if (formatRequests.length > 0) {
    try {
      const formatRes = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ requests: formatRequests }),
        }
      );
      if (!formatRes.ok) {
        const errJson = await formatRes.json().catch(() => ({}));
        console.warn('Batch format update warning:', errJson);
      }
    } catch (err) {
      console.warn('Could not execute sheet formatting batch update:', err);
    }
  }
}

/**
 * Pulls and parses data from a Google Spreadsheet to update or restore local progress
 */
export async function pullFromSpreadsheet(
  accessToken: string,
  spreadsheetId: string,
  currentChapters: ChapterProgress[]
): Promise<ChapterProgress[]> {
  // First fetch spreadsheet metadata to get existing sheet names
  const metaRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!metaRes.ok) {
    const err = await metaRes.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Failed to read spreadsheet metadata (${metaRes.status})`);
  }

  const meta = await metaRes.json();
  const sheets: { properties: { title: string } }[] = meta.sheets || [];
  const sheetTitles = sheets.map((s) => s.properties.title);

  const updatedChapters = [...currentChapters];

  // Map each paper
  const configs: { subject: SubjectId; paper: PaperId; expectedNames: string[] }[] = [
    { subject: 'physics', paper: '1st', expectedNames: ['Physics 1st Paper', 'Physics 1st', 'Sheet1'] },
    { subject: 'physics', paper: '2nd', expectedNames: ['Physics 2nd Paper', 'Physics 2nd'] },
    { subject: 'chemistry', paper: '1st', expectedNames: ['Chemistry 1st Paper', 'Chemistry 1st', 'Chem 1st'] },
    { subject: 'chemistry', paper: '2nd', expectedNames: ['Chemistry 2nd Paper', 'Chemistry 2nd', 'Chem 2nd'] },
    { subject: 'higher_math', paper: '1st', expectedNames: ['Higher Math 1st Paper', 'Math 1st Paper', 'Higher Math 1st'] },
    { subject: 'higher_math', paper: '2nd', expectedNames: ['Higher Math 2nd Paper', 'Math 2nd Paper', 'Higher Math 2nd'] },
    { subject: 'biology', paper: '1st', expectedNames: ['Biology 1st Paper', 'Biology 1st', 'Bio 1st'] },
    { subject: 'biology', paper: '2nd', expectedNames: ['Biology 2nd Paper', 'Biology 2nd', 'Bio 2nd'] },
  ];

  for (const conf of configs) {
    // Find matching sheet title
    const matchingTitle = sheetTitles.find((t) =>
      conf.expectedNames.some((exp) => t.toLowerCase().includes(exp.toLowerCase()))
    );

    if (!matchingTitle) continue;

    const range = encodeURIComponent(`'${matchingTitle}'!A3:I45`);
    const valRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    if (!valRes.ok) continue;

    const valData = await valRes.json();
    const rows: string[][] = valData.values || [];
    if (rows.length === 0) continue;

    // Header row is index 0:
    const headerRow = rows[0] || [];
    // Detect whether Exam-1 is at column 3 (new layout where Chapter spans A, B, C) or column 1 (legacy layout)
    const exam1Index = headerRow.findIndex((c) => String(c).toLowerCase().includes('exam-1'));
    const isThreeColChapter = exam1Index === 3;
    const e1Col = isThreeColChapter ? 3 : 1;
    const e2Col = isThreeColChapter ? 4 : 2;
    const e3Col = isThreeColChapter ? 5 : 3;
    const avgCol = isThreeColChapter ? 6 : 4;
    const currWeekCol = isThreeColChapter ? 7 : 5;
    const statusCol = isThreeColChapter ? 8 : 6;
    const notesCol = isThreeColChapter ? -1 : 7;

    const dataRows = rows.slice(1);

    for (const row of dataRows) {
      if (!row || !row[0]) continue;
      const chapterTitle = row[0].trim();

      // Find matching chapter in our list
      const index = updatedChapters.findIndex(
        (c) =>
          c.subject === conf.subject &&
          c.paper === conf.paper &&
          (c.nameBn.includes(chapterTitle) ||
            chapterTitle.includes(c.nameBn) ||
            c.nameEn.toLowerCase().includes(chapterTitle.toLowerCase()))
      );

      if (index !== -1) {
        const parseScore = (val: any): number | null => {
          if (val === undefined || val === null || val === '') return null;
          const num = parseFloat(String(val).replace(/[^0-9.]/g, ''));
          return isNaN(num) ? null : num;
        };

        const e1 = parseScore(row[e1Col]);
        const e2 = parseScore(row[e2Col]);
        const e3 = parseScore(row[e3Col]);

        const avg = calculateChapterAverage(e1, e2, e3);

        const isCurrent =
          String(row[currWeekCol] || '').toUpperCase() === 'TRUE' ||
          String(row[currWeekCol] || '').toLowerCase() === 'yes' ||
          String(row[currWeekCol] || '').toLowerCase() === 'current';

        const statusRaw = String(row[statusCol] || '').toLowerCase();
        let status = updatedChapters[index].status;
        if (statusRaw.includes('complete')) status = 'completed';
        else if (statusRaw.includes('progress')) status = 'in_progress';
        else if (statusRaw.includes('revision')) status = 'revision';

        const existingNotes = updatedChapters[index].notes;
        const pulledNotes = notesCol !== -1 && row[notesCol] !== undefined ? row[notesCol] : existingNotes;

        updatedChapters[index] = {
          ...updatedChapters[index],
          exam1: e1,
          exam2: e2,
          exam3: e3,
          average: avg,
          isCurrentWeek: isCurrent,
          status,
          notes: pulledNotes,
          lastUpdated: new Date().toISOString(),
        };
      }
    }
  }

  return updatedChapters;
}
