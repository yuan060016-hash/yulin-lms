"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import toast from "react-hot-toast";
import MuxPlayer from "@mux/mux-player-react";
import { FileUpload } from "@/components/file-upload";
import { EFileUploadEndpoint } from "@/core/frontend/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const ActivityVideoForm = ({ courseId, chapterId, activity }: {
  courseId: string; chapterId: string;
  activity: { id: string; videoUrl?: string; playbackId?: string; videoProvider?: string | null };
}) => {
  const router = useRouter();
  const [url, setUrl] = useState(activity.videoUrl || "");
  const [saving, setSaving] = useState(false);
  const save = async (videoUrl: string, provider: "external-url" | "mux") => {
    setSaving(true);
    try {
      await axios.post(`/api/courses/${courseId}/chapters/${chapterId}/activities/${activity.id}/video`, { videoUrl, provider });
      toast.success("课时视频已保存");
      router.refresh();
    } catch (error: any) { toast.error(error?.response?.data?.message || "视频保存失败"); }
    finally { setSaving(false); }
  };
  const isMux = activity.videoProvider !== "external-url" && !!activity.playbackId;
  return <section className="mt-6 space-y-4 rounded-lg border bg-slate-50 p-5">
    <h2 className="font-semibold">课时视频</h2>
    {activity.videoUrl && <div className="aspect-video overflow-hidden rounded bg-slate-900">
      {isMux ? <MuxPlayer playbackId={activity.playbackId} /> : <video className="h-full w-full" controls preload="metadata" src={activity.videoUrl} controlsList="nodownload" />}
    </div>}
    <form className="space-y-3" onSubmit={e => { e.preventDefault(); void save(url, "external-url"); }}>
      <label htmlFor="lesson-video-url" className="block text-sm font-medium">测试视频地址</label>
      <Input id="lesson-video-url" type="url" required value={url} onChange={e => setUrl(e.target.value)} placeholder="https://…/lesson.mp4" />
      <p className="text-xs text-slate-500">填写你有权使用的 MP4 测试地址。正式课程视频稍后接入腾讯云点播；请勿填写密钥。</p>
      <Button disabled={saving || !url.trim()}>{saving ? "保存中…" : "保存视频地址"}</Button>
    </form>
    <details className="border-t pt-3">
      <summary className="cursor-pointer text-sm text-slate-600">原有 Mux 上传入口</summary>
      <p className="my-3 text-xs text-slate-500">需配置 Mux 和 UploadThing 后使用。</p>
      <FileUpload endpoint={EFileUploadEndpoint.activityVideo} onChange={value => { if (value && !saving) void save(value, "mux"); }} />
    </details>
  </section>;
};
