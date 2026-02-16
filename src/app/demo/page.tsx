"use client";

/**
 * Demo CRUD Page — Notes
 *
 * This page demonstrates the full Supabase-backed CRUD pattern:
 * - Create, Read, Update, Delete records
 * - Form validation with React Hook Form + Zod
 * - User-scoped data via RLS
 *
 * >>> DELETE this file and replace with your app's main feature. <<<
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Trash2, Pencil } from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { DemoNote } from "@/lib/types";
import { formatDate } from "@/lib/utils";

const noteSchema = z.object({
  title: z.string().min(1, "Title is required"),
  content: z.string().optional(),
});

type NoteFormValues = z.infer<typeof noteSchema>;

export default function DemoPage() {
  const { user } = useAuth();
  const [notes, setNotes] = useState<DemoNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  const supabase = useMemo(() => {
    try {
      return createClient();
    } catch {
      return null;
    }
  }, []);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<NoteFormValues>({
    resolver: zodResolver(noteSchema),
    defaultValues: { title: "", content: "" },
  });

  const fetchNotes = useCallback(async () => {
    if (!user || !supabase) {
      setLoading(false);
      return;
    }
    const { data, error } = await supabase
      .from("demo_notes")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      setError(error.message);
    } else {
      setNotes(data || []);
    }
    setLoading(false);
  }, [user, supabase]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchNotes();
  }, [fetchNotes]);

  const onSubmit = async (values: NoteFormValues) => {
    if (!user || !supabase) return;
    setError(null);

    if (editingId) {
      // Update existing note
      const { error } = await supabase
        .from("demo_notes")
        .update({
          title: values.title,
          content: values.content || null,
        })
        .eq("id", editingId);

      if (error) {
        setError(error.message);
      } else {
        setEditingId(null);
        reset();
        fetchNotes();
      }
    } else {
      // Create new note
      const { error } = await supabase.from("demo_notes").insert({
        user_id: user.id,
        title: values.title,
        content: values.content || null,
      });

      if (error) {
        setError(error.message);
      } else {
        reset();
        fetchNotes();
      }
    }
  };

  const startEdit = (note: DemoNote) => {
    setEditingId(note.id);
    setValue("title", note.title);
    setValue("content", note.content || "");
  };

  const cancelEdit = () => {
    setEditingId(null);
    reset();
  };

  const deleteNote = async (id: string) => {
    if (!supabase) return;
    const { error } = await supabase.from("demo_notes").delete().eq("id", id);

    if (error) {
      setError(error.message);
    } else {
      if (editingId === id) cancelEdit();
      fetchNotes();
    }
  };

  return (
    <main className="space-y-10">
      {/* Header */}
      <div className="space-y-2">
        <p className="type-meta">Demo</p>
        <h1 className="type-h1">Notes</h1>
        <p className="type-lead">
          A demo CRUD page backed by Supabase. Replace this with your app&apos;s feature.
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      {/* Content Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Form */}
        <div className="rounded-2xl border border-slate-200 bg-white/85 p-6 shadow-sm">
          <h2 className="text-lg font-semibold">
            {editingId ? "Edit note" : "Add a note"}
          </h2>
          <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-700">
                Title
              </label>
              <input
                {...register("title")}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-slate-400 focus:outline-none"
                placeholder="Note title"
              />
              {errors.title && (
                <p className="mt-1 text-xs text-rose-600">
                  {errors.title.message}
                </p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">
                Content{" "}
                <span className="font-normal text-slate-400">(optional)</span>
              </label>
              <textarea
                {...register("content")}
                rows={3}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-slate-400 focus:outline-none resize-none"
                placeholder="Write something..."
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              {editingId && (
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:border-slate-400"
                >
                  Cancel
                </button>
              )}
              <button
                type="submit"
                className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-slate-800"
              >
                {editingId ? "Update note" : "Add note"}
              </button>
            </div>
          </form>
        </div>

        {/* List */}
        <div className="rounded-2xl border border-slate-200 bg-white/85 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Your notes</h2>
            <span className="text-xs text-slate-500">
              {notes.length} {notes.length === 1 ? "note" : "notes"}
            </span>
          </div>
          {loading ? (
            <p className="mt-4 type-lead">Loading...</p>
          ) : notes.length === 0 ? (
            <p className="mt-4 type-lead">
              No notes yet. Add one to get started.
            </p>
          ) : (
            <div className="mt-4 space-y-2">
              {notes.map((note) => (
                <div
                  key={note.id}
                  className="flex items-start gap-3 rounded-xl border border-slate-100 bg-white px-4 py-3"
                >
                  <div className="flex-grow min-w-0">
                    <p className="text-sm font-medium text-slate-900">
                      {note.title}
                    </p>
                    {note.content && (
                      <p className="mt-1 text-xs text-slate-600 line-clamp-2">
                        {note.content}
                      </p>
                    )}
                    <p className="mt-1 text-xs text-slate-400">
                      {formatDate(note.created_at)}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <button
                      onClick={() => startEdit(note)}
                      className="p-2 text-slate-400 hover:text-slate-600"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={() => deleteNote(note.id)}
                      className="p-2 text-slate-400 hover:text-red-500"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
