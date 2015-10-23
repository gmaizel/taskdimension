-- sqlite schema

create table parties (
    id              integer primary key,
    title           text not null,
    creationTime    integer not null default (strftime('%s', 'now'))
);

create table users (
    id              integer primary key,
    partyId         integer not null,
    mode            integer default 0,
    login           text not null,
    password        text not null,
    fullName        text not null,
    creationTime    integer not null default (strftime('%s', 'now'))
);

create table projects (
    id              integer primary key,
    partyId         integer not null,
    title           text not null,
    description     text not null,
    ord             integer not null,
    createdBy       integer not null,
    creationTime    integer not null default (strftime('%s', 'now'))
);

create table lists (
    id              integer primary key,
    projectId       integer not null,
    title           text not null,
    ord             integer not null,
    createdBy       integer not null,
    creationTime    integer not null default (strftime('%s', 'now'))
);

create table tasks (
    id              integer primary key,
    listId          integer not null,
    title           text not null,
    description     text default null,
    ord             integer not null,
    status          integer not null default 1,
    estimatedHours  integer default null,
    actualHours     integer default null,
    createdBy       integer not null,
    creationTime    integer not null default (strftime('%s', 'now')),
    completedBy     integer default null,
    completionTime  integer default null
);
