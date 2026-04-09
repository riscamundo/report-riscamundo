
-- Allow clients to INSERT their own tasks
CREATE POLICY "Clients can insert own tarefas"
ON public.tarefas_cliente
FOR INSERT
TO authenticated
WITH CHECK (
  cliente_id IN (
    SELECT id FROM public.clientes WHERE user_id = auth.uid()
  )
);

-- Allow clients to UPDATE their own tasks (e.g. change status)
CREATE POLICY "Clients can update own tarefas"
ON public.tarefas_cliente
FOR UPDATE
TO authenticated
USING (
  cliente_id IN (
    SELECT id FROM public.clientes WHERE user_id = auth.uid()
  )
);
