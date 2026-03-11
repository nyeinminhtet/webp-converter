import sharp from 'sharp';

export const runtime = 'nodejs';

function getOutputName(originalName: string) {
  const baseName = originalName.replace(/\.png$/i, '') || 'converted';
  return `${baseName}.webp`;
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!(file instanceof File)) {
      return new Response('No file uploaded.', { status: 400 });
    }

    if (file.type !== 'image/png') {
      return new Response('Only PNG files are supported.', { status: 400 });
    }

    const inputBuffer = Buffer.from(await file.arrayBuffer());
    const outputBuffer = await sharp(inputBuffer).webp().toBuffer();
    const outputName = getOutputName(file.name);

    return new Response(new Uint8Array(outputBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'image/webp',
        'Content-Disposition': `attachment; filename="${outputName}"`,
        'Content-Length': outputBuffer.length.toString(),
      },
    });
  } catch {
    return new Response('Failed to convert image.', { status: 500 });
  }
}
