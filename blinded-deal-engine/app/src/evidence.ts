export type EvidenceMetadata = {
  dealId: bigint;
  obligationId: bigint;
  version: number;
  fileName: string;
  mimeType: string;
  byteLength: number;
};

const encoder = new TextEncoder();

function toHex(bytes: Uint8Array): `0x${string}` {
  return `0x${Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("")}`;
}

export async function sha256(data: ArrayBuffer): Promise<`0x${string}`> {
  const digest = await crypto.subtle.digest("SHA-256", data);
  return toHex(new Uint8Array(digest));
}

export async function createDeliverableEvidence(
  file: File,
  metadata: EvidenceMetadata,
): Promise<{
  fileHash: `0x${string}`;
  evidenceHash: `0x${string}`;
  metadata: EvidenceMetadata;
}> {
  if (file.size === 0) throw new Error("Deliverable cannot be empty");

  const fileHash = await sha256(await file.arrayBuffer());
  const canonicalMetadata = JSON.stringify({
    dealId: metadata.dealId.toString(),
    obligationId: metadata.obligationId.toString(),
    version: metadata.version,
    fileName: metadata.fileName,
    mimeType: metadata.mimeType,
    byteLength: metadata.byteLength,
    fileHash,
  });
  const evidenceHash = await sha256(encoder.encode(canonicalMetadata).buffer);

  return { fileHash, evidenceHash, metadata };
}
