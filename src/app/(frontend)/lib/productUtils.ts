export type ProductImage = {
  url?: string;
  filename?: string;
  alt?: string;
};

export type RelationItem = {
  id: string;
  name?: string;
};

export type RelationValue =
  | RelationItem
  | string
  | (RelationItem | string)[]
  | null
  | undefined;

export function getImageUrl(image: ProductImage | string | null | undefined) {
  if (!image) return "";

  if (typeof image === "string") {
    return "";
  }

  if (image.url) {
    return image.url;
  }

  if (image.filename) {
    return `/api/media/file/${image.filename}`;
  }

  return "";
}

export function getRelationId(
  value: RelationItem | string | null | undefined
) {
  if (!value) return "";

  if (typeof value === "string") {
    return value;
  }

  return value.id;
}

export function getRelationName(
  value: RelationItem | string | null | undefined
) {
  if (!value) return "";

  if (typeof value === "string") {
    return "";
  }

  return value.name || "";
}

export function getRelationIds(value: RelationValue) {
  if (!value) return [];

  if (Array.isArray(value)) {
    return value.map((item) => getRelationId(item)).filter(Boolean);
  }

  const id = getRelationId(value);

  return id ? [id] : [];
}

export function getRelationNames(value: RelationValue) {
  if (!value) return [];

  if (Array.isArray(value)) {
    return value.map((item) => getRelationName(item)).filter(Boolean);
  }

  const name = getRelationName(value);

  return name ? [name] : [];
}

export function formatLabel(value: string) {
  if (!value) return "";

  return value
    .split(" ")
    .map((word) => {
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(" ");
}