const MAX_IMAGE_SIZE_BYTES = 2 * 1024 * 1024;

type ClubImagePreprocessResult = {
  file: File;
  previewImageUrl: string;
};

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : null;
      if (!result) {
        reject(new Error("이미지 미리보기를 불러오지 못했습니다."));
        return;
      }
      resolve(result);
    };

    reader.onerror = () => {
      reject(new Error("이미지 미리보기를 불러오지 못했습니다."));
    };

    reader.readAsDataURL(file);
  });
}

export async function preprocessClubImageFile(
  file: File,
): Promise<ClubImagePreprocessResult> {
  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    throw new Error("이미지 파일은 최대 2MB까지 업로드할 수 있습니다.");
  }

  const previewImageUrl = await readFileAsDataUrl(file);

  return {
    file,
    previewImageUrl,
  };
}

export async function urlToFile(imageUrl: string): Promise<File> {
  const response = await fetch(imageUrl);
  const blob = await response.blob();
  const filename = imageUrl.split("/").pop() || "image.jpg";
  return new File([blob], filename, { type: blob.type });
}
