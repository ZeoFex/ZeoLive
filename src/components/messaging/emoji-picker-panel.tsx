"use client";

import { memo } from "react";
import { CHAT_EMOJI_GROUPS, QUICK_CHAT_EMOJIS } from "@/lib/chat-emojis";

function EmojiPickerPanelInner({ onPick }: { onPick: (emoji: string) => void }) {
  return (
    <div className="absolute bottom-full left-0 z-50 mb-2 w-[min(100%,280px)] rounded-2xl border border-slate-200 bg-white p-3 shadow-xl">
      <div className="mb-2 flex flex-wrap gap-1 border-b border-slate-100 pb-2">
        {QUICK_CHAT_EMOJIS.map((emoji) => (
          <button
            key={emoji}
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-lg hover:bg-slate-100"
            onClick={() => onPick(emoji)}
          >
            {emoji}
          </button>
        ))}
      </div>
      <div className="max-h-40 space-y-2 overflow-y-auto overscroll-contain">
        {CHAT_EMOJI_GROUPS.map((group) => (
          <div key={group.label}>
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
              {group.label}
            </p>
            <div className="flex flex-wrap gap-0.5">
              {group.emojis.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  className="flex h-8 w-8 items-center justify-center rounded-md text-base hover:bg-slate-100"
                  onClick={() => onPick(emoji)}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export const EmojiPickerPanel = memo(EmojiPickerPanelInner);
