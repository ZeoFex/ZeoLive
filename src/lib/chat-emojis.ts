/** Common chat emojis — no external picker dependency. */
export const CHAT_EMOJI_GROUPS = [
  {
    label: "Smileys",
    emojis: ["😀", "😃", "😄", "😁", "😅", "😂", "🤣", "😊", "😇", "🙂", "😉", "😍", "🥰", "😘", "😎", "🤔", "😮", "😢", "😭", "😤", "🙏", "👍", "👎", "👏", "🙌"],
  },
  {
    label: "Study",
    emojis: ["📚", "✏️", "📝", "📖", "🎓", "💡", "✅", "❌", "⭐", "🔥", "💯", "🎯", "📅", "⏰", "📌", "🔗"],
  },
  {
    label: "Hearts",
    emojis: ["❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "💕", "💖", "💗", "💝"],
  },
] as const;

export const QUICK_CHAT_EMOJIS = ["👍", "❤️", "😂", "😊", "🎉", "🙏", "✅", "👏"] as const;
