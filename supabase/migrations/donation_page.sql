alter table campaigns add column if not exists ai_summary jsonb;
alter table campaigns add column if not exists page_primary_color text;
alter table campaigns add column if not exists page_accent_color text;
alter table campaigns add column if not exists page_show_scorecards boolean default true;
alter table campaigns add column if not exists page_show_chatbot boolean default true;
alter table campaigns add column if not exists page_intro_override text;
