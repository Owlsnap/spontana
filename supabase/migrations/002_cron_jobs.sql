-- Enable required extensions
create extension if not exists pg_cron with schema extensions;
create extension if not exists pg_net with schema extensions;

-- Schedule Visitstockholm scraper: every day at 03:00 UTC
select cron.schedule(
  'scrape-visitstockholm-daily',
  '0 3 * * *',
  $$
  select net.http_post(
    url    := 'https://wqubexjnvhyunajfmvwp.supabase.co/functions/v1/scrape-visitstockholm',
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndxdWJleGpudmh5dW5hamZtdndwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE1NDMwMDIsImV4cCI6MjA4NzExOTAwMn0.g89INFDKn4_nhONsjsoKVqrbhAB9h91G6rbTQOIJXvU'
    ),
    body   := '{}'::jsonb
  );
  $$
);

-- Schedule Ticketmaster sync: every day at 03:10 UTC (offset to avoid overlap)
select cron.schedule(
  'fetch-ticketmaster-daily',
  '10 3 * * *',
  $$
  select net.http_post(
    url    := 'https://wqubexjnvhyunajfmvwp.supabase.co/functions/v1/fetch-events',
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndxdWJleGpudmh5dW5hamZtdndwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE1NDMwMDIsImV4cCI6MjA4NzExOTAwMn0.g89INFDKn4_nhONsjsoKVqrbhAB9h91G6rbTQOIJXvU'
    ),
    body   := '{}'::jsonb
  );
  $$
);
