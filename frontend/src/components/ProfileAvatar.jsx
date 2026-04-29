import React, { useEffect, useRef, useState } from "react";
import { api, API } from "../lib/api";
import { Camera, Trash2, Loader2 } from "lucide-react";

// Renders profile avatar (photo or initials) — handles auth via fetch-as-blob.
export function ProfileAvatar({ profile, size = 56, className = "" }) {
  const [blobUrl, setBlobUrl] = useState(null);

  useEffect(() => {
    if (!profile?.has_photo) { setBlobUrl(null); return; }
    let cancelled = false;
    let url = null;
    (async () => {
      try {
        const r = await api.get(`/profiles/${profile.id}/photo`, { responseType: "blob" });
        if (cancelled) return;
        url = URL.createObjectURL(r.data);
        setBlobUrl(url);
      } catch (e) {
        if (!cancelled) setBlobUrl(null);
      }
    })();
    return () => { cancelled = true; if (url) URL.revokeObjectURL(url); };
  }, [profile?.id, profile?.has_photo]);

  const initial = (profile?.name || "?").charAt(0).toUpperCase();
  const dim = { width: size, height: size };
  const bg = profile?.gender === "female" ? "linear-gradient(135deg, #E07A5F, #D4A373)" : profile?.gender === "male" ? "linear-gradient(135deg, #2A5948, #52796F)" : "linear-gradient(135deg, #84A59D, #5C7063)";

  if (blobUrl) {
    return <img src={blobUrl} alt={profile.name} style={dim} className={`rounded-full object-cover border-2 border-white shadow-sm ${className}`} />;
  }
  return (
    <div data-testid={`avatar-${profile?.id}`} style={{ ...dim, background: bg }} className={`rounded-full flex items-center justify-center text-white font-bold border-2 border-white shadow-sm ${className}`}>
      <span style={{ fontSize: size * 0.4 }}>{initial}</span>
    </div>
  );
}

// Editable avatar — click to upload a new photo, X to remove
export function ProfileAvatarEditable({ profile, onChanged, size = 96 }) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  const onFile = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.type.startsWith("image/")) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", f);
      await api.post(`/profiles/${profile.id}/photo`, fd, { headers: { "Content-Type": "multipart/form-data" } });
      onChanged?.();
    } finally { setUploading(false); e.target.value = ""; }
  };

  const remove = async () => {
    if (!profile.has_photo) return;
    setUploading(true);
    try {
      await api.delete(`/profiles/${profile.id}/photo`);
      onChanged?.();
    } finally { setUploading(false); }
  };

  return (
    <div className="relative inline-block">
      <ProfileAvatar profile={profile} size={size} />
      <button onClick={() => inputRef.current?.click()} disabled={uploading} data-testid={`avatar-upload-${profile.id}`} title="Change photo"
        className="absolute -bottom-1 -right-1 h-9 w-9 rounded-full bg-white border border-[var(--border)] shadow flex items-center justify-center hover:bg-[var(--surface)] disabled:opacity-50">
        {uploading ? <Loader2 size={15} className="animate-spin" /> : <Camera size={15} />}
      </button>
      {profile.has_photo && (
        <button onClick={remove} disabled={uploading} data-testid={`avatar-remove-${profile.id}`} title="Remove photo"
          className="absolute -top-1 -right-1 h-7 w-7 rounded-full bg-white border border-[var(--border)] shadow flex items-center justify-center hover:bg-red-50 hover:text-red-600">
          <Trash2 size={12} />
        </button>
      )}
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={onFile} />
    </div>
  );
}
