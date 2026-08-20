const HEX_COLOR = /^#[0-9a-f]{6}$/i;

function mixChannel(first: number, second: number, firstWeight: number) {
  return Math.round(first * firstWeight + second * (1 - firstWeight));
}

function parseHex(color: string) {
  if (!HEX_COLOR.test(color)) {
    throw new Error(`Invalid hex color: ${color}`);
  }

  return [1, 3, 5].map((offset) => Number.parseInt(color.slice(offset, offset + 2), 16));
}

function formatHex(channels: number[]) {
  return `#${channels.map((channel) => channel.toString(16).padStart(2, "0")).join("")}`;
}

function mixHex(first: string, second: string, firstWeight: number) {
  const firstChannels = parseHex(first);
  const secondChannels = parseHex(second);

  return formatHex(
    firstChannels.map((channel, index) =>
      mixChannel(channel, secondChannels[index], firstWeight),
    ),
  );
}

export function deriveMotionColors(primaryColor: string) {
  return {
    light: mixHex(primaryColor, "#ffffff", 0.7),
    dark: mixHex(primaryColor, "#120f17", 0.72),
  };
}
