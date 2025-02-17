
\c personal_management
create schema if not exists personal_management;


grant usage, create on schema personal_management to personal_user;
grant select, insert, update, delete on all tables in schema personal_management to personal_user;
grant usage, select on all sequences in schema personal_management to personal_user;
