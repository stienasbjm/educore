-- Preserve historical usage but correct token counts that fell behind existing participants.
UPDATE public.tokens AS token
SET used_count = participant_usage.total_count
FROM (
  SELECT token_code, count(*)::integer AS total_count
  FROM public.participants
  GROUP BY token_code
) AS participant_usage
WHERE lower(token.code) = lower(participant_usage.token_code)
  AND token.used_count < participant_usage.total_count;
