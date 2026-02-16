/**
 * Core type definitions for the app.
 *
 * >>> Replace DemoNote with your app's domain types. <<<
 */

export type DemoNote = {
  id: string;
  user_id: string;
  title: string;
  content: string | null;
  created_at: string;
  updated_at: string;
};
