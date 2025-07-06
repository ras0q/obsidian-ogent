export function generateCallout(
  type: string,
  title: string,
  body: string,
  foldable: boolean,
) {
  return `
> [!${type}]${foldable ? "-" : ""} ${title}
> ${body.replaceAll(/\n/g, "\n> ")}

`;
}

export function generateJSONCallout(
  type: string,
  title: string,
  body: unknown,
  foldable: boolean,
) {
  return generateCallout(
    type,
    title,
    `\`\`\`json\n${JSON.stringify(body, null, 2)}\n\`\`\``,
    foldable,
  );
}
