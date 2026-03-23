import sharp from 'sharp';

export const runtime = 'nodejs';

type OutputFormat = 'jpg' | 'png' | 'webp';

const supportedInputTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];

const outputConfig: Record<
  OutputFormat,
  {
    contentType: string;
    extension: string;
  }
> = {
  jpg: {
    contentType: 'image/jpeg',
    extension: 'jpg',
  },
  png: {
    contentType: 'image/png',
    extension: 'png',
  },
  webp: {
    contentType: 'image/webp',
    extension: 'webp',
  },
};

function getOutputName(originalName: string, extension: string) {
  const baseName = originalName.replace(/\.[^.]+$/i, '') || 'converted';
  return `${baseName}.${extension}`;
}

function isOutputFormat(value: FormDataEntryValue | null): value is OutputFormat {
  return value === 'jpg' || value === 'png' || value === 'webp';
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const outputFormatValue = formData.get('outputFormat');

    if (!(file instanceof File)) {
      return new Response('No file uploaded.', { status: 400 });
    }

    if (!isOutputFormat(outputFormatValue)) {
      return new Response('Invalid output format.', { status: 400 });
    }

    if (!supportedInputTypes.includes(file.type)) {
      return new Response('Only PNG, JPG, or WebP files are supported.', {
        status: 400,
      });
    }

    const inputBuffer = Buffer.from(await file.arrayBuffer());
    const sharpInput = sharp(inputBuffer);

    const outputBuffer =
      outputFormatValue === 'jpg'
        ? await sharpInput.jpeg({ quality: 90 }).toBuffer()
        : outputFormatValue === 'png'
          ? await sharpInput.png().toBuffer()
          : await sharpInput.webp().toBuffer();

    const config = outputConfig[outputFormatValue];
    const outputName = getOutputName(file.name, config.extension);

    return new Response(new Uint8Array(outputBuffer), {
      status: 200,
      headers: {
        'Content-Type': config.contentType,
        'Content-Disposition': `attachment; filename="${outputName}"`,
        'Content-Length': outputBuffer.length.toString(),
      },
    });
  } catch {
    return new Response('Failed to convert image.', { status: 500 });
  }
}
