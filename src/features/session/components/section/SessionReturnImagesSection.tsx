"use client";

import Image from "next/image";
import { palette } from "../../constants/session-ui.constants";
import type { Session } from "../../types";

export function SessionReturnImagesSection({ session }: { session: Session }) {
  return (
    <div>
      <h3 className="px-1 text-lg font-bold" style={{ color: palette.grey700 }}>
        종료 사진
      </h3>
      <div className="h-5" />
      {!session.forceEnd ? (
        session.returnImageUrl && session.returnImageUrl.length > 0 ? (
          <div className="flex gap-3 overflow-x-auto pb-2 pl-1 pr-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {session.returnImageUrl.map((url, idx) => (
              <a
                key={`${url}-${idx}`}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="relative block h-40 w-[120px] shrink-0 overflow-hidden rounded-2xl border focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                style={{ borderColor: palette.grey200 }}
              >
                <Image
                  src={url}
                  alt={`${session.title} ${idx + 1}`}
                  fill
                  className="object-cover"
                  sizes="120px"
                />
              </a>
            ))}
          </div>
        ) : (
          <p className="py-8 text-center text-gray-300">
            사진이 존재하지 않습니다.
          </p>
        )
      ) : (
        <p className="py-8 text-center text-gray-300">
          강제 종료된 이용입니다.
        </p>
      )}
    </div>
  );
}
