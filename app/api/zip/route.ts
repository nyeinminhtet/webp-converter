import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const execFileAsync = promisify(execFile);

export const runtime = 'nodejs';

function sanitizeFileName(fileName: string) {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, '-');
}

export async function POST(request: Request) {
  let workingDirectory = '';

  try {
    const formData = await request.formData();
    const files = formData.getAll('files');

    if (files.length === 0) {
      return new Response('No files uploaded.', { status: 400 });
    }

    workingDirectory = await mkdtemp(join(tmpdir(), 'webp-zip-'));
    const archivePath = join(workingDirectory, 'converted-webp-files.zip');
    const writtenFiles: string[] = [];

    for (const file of files) {
      if (!(file instanceof File)) {
        return new Response('Invalid file upload.', { status: 400 });
      }

      if (file.type !== 'image/webp') {
        return new Response('Only WebP files can be zipped.', { status: 400 });
      }

      const outputPath = join(workingDirectory, sanitizeFileName(file.name));
      const buffer = Buffer.from(await file.arrayBuffer());
      await writeFile(outputPath, buffer);
      writtenFiles.push(outputPath);
    }

    await execFileAsync('/usr/bin/zip', ['-j', archivePath, ...writtenFiles], {
      cwd: workingDirectory,
    });

    const archiveBuffer = await readFile(archivePath);

    return new Response(new Uint8Array(archiveBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': 'attachment; filename="converted-webp-files.zip"',
        'Content-Length': archiveBuffer.length.toString(),
      },
    });
  } catch {
    return new Response('Failed to create ZIP file.', { status: 500 });
  } finally {
    if (workingDirectory) {
      await rm(workingDirectory, { recursive: true, force: true });
    }
  }
}
