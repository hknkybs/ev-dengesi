// Runs on a schedule (see README in this folder). For every assigned task
// whose next_notify_at has passed, pushes a reminder to the assigned
// member's device via Expo's push API, then marks it notified so it won't
// fire again until the next completion or reassignment rearms it.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

interface DueTask {
  task_id: string;
  task_name: string;
  room_name: string;
  assigned_member_id: string;
  expo_push_token: string;
}

Deno.serve(async () => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !serviceRoleKey) {
    return new Response(JSON.stringify({ error: 'missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY' }), {
      status: 500,
    });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  const { data: dueTasks, error } = await supabase.rpc('get_due_assigned_tasks');
  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  const tasks = (dueTasks ?? []) as DueTask[];
  if (tasks.length === 0) {
    return new Response(JSON.stringify({ sent: 0 }), { status: 200 });
  }

  const messages = tasks.map((t) => ({
    to: t.expo_push_token,
    sound: 'default',
    title: `${t.room_name} bekliyor`,
    body: `${t.task_name} — sıra sende, bir süredir yapılmadı.`,
  }));

  const pushResponse = await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(messages),
  });
  const pushResult = await pushResponse.json();

  const taskIds = tasks.map((t) => t.task_id);
  await supabase.from('task_templates').update({ notified_at: new Date().toISOString() }).in('id', taskIds);

  return new Response(JSON.stringify({ sent: messages.length, pushResult }), { status: 200 });
});
