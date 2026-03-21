import sharp from 'sharp';

export const runtime = 'nodejs';

type ConversionMode = 'png-to-jpg' | 'jpg-to-webp';

const conversionConfig: Record<
  ConversionMode,
  {
    contentType: string;
    extension: string;
    inputTypes: string[];
  }
> = {
  'png-to-jpg': {
    contentType: 'image/jpeg',
    extension: 'jpg',
    inputTypes: ['image/png'],
  },
  'jpg-to-webp': {
    contentType: 'image/webp',
    extension: 'webp',
    inputTypes: ['image/jpeg', 'image/jpg'],
  },
};

function getOutputName(originalName: string, extension: string) {
  const baseName = originalName.replace(/\.[^.]+$/i, '') || 'converted';
  return `${baseName}.${extension}`;
}

function isConversionMode(value: FormDataEntryValue | null): value is ConversionMode {
  return value === 'png-to-jpg' || value === 'jpg-to-webp';
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const modeValue = formData.get('mode');

    if (!(file instanceof File)) {
      return new Response('No file uploaded.', { status: 400 });
    }

    if (!isConversionMode(modeValue)) {
      return new Response('Invalid conversion mode.', { status: 400 });
    }

    const config = conversionConfig[modeValue];

    if (!config.inputTypes.includes(file.type)) {
      return new Response('This file type does not match the selected conversion mode.', {
        status: 400,
      });
    }

    const inputBuffer = Buffer.from(await file.arrayBuffer());
    const sharpInput = sharp(inputBuffer);

    const outputBuffer =
      modeValue === 'png-to-jpg'
        ? await sharpInput.jpeg({ quality: 90 }).toBuffer()
        : await sharpInput.webp().toBuffer();

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
