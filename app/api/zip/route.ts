import { PassThrough } from 'node:stream';

export const runtime = 'nodejs';

const allowedZipTypes = ['image/webp', 'image/jpeg', 'image/jpg'];

function sanitizeFileName(fileName: string) {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, '-');
}

async function createZipBuffer(files: File[]) {
  const { default: archiver } = await import('archiver');
  const archive = archiver('zip', { zlib: { level: 9 } });
  const output = new PassThrough();
  const chunks: Buffer[] = [];

  const bufferPromise = new Promise<Buffer>((resolve, reject) => {
    output.on('data', (chunk) => {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    });
    output.on('end', () => {
      resolve(Buffer.concat(chunks));
    });
    output.on('error', reject);
    archive.on('error', reject);
  });

  archive.pipe(output);

  for (const file of files) {
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    archive.append(fileBuffer, { name: sanitizeFileName(file.name) });
  }

  await archive.finalize();

  return bufferPromise;
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const files = formData.getAll('files');

    if (files.length === 0) {
      return new Response('No files uploaded.', { status: 400 });
    }

    const validFiles: File[] = [];

    for (const file of files) {
      if (!(file instanceof File)) {
        return new Response('Invalid file upload.', { status: 400 });
      }

      if (!allowedZipTypes.includes(file.type)) {
        return new Response('Only converted image files can be zipped.', {
          status: 400,
        });
      }

      validFiles.push(file);
    }

    const archiveBuffer = await createZipBuffer(validFiles);

    return new Response(new Uint8Array(archiveBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': 'attachment; filename="converted-files.zip"',
        'Content-Length': archiveBuffer.length.toString(),
      },
    });
  } catch {
    return new Response('Failed to create ZIP file.', { status: 500 });
  }
}
