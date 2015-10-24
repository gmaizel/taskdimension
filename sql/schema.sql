create database `taskdimension` default character set 'utf8mb4' collate 'utf8mb4_unicode_ci';
use `taskdimension`;

create table `users` (
    `id`            bigint unsigned not null auto_increment primary key,
    `login`         varchar(128) not null,
    `password`      varchar(256) not null,
    `fullName`      varchar(256) not null,
    `creationTime`  timestamp not null default current_timestamp
) engine=InnoDB;

create table `projects` (
    `id`            bigint unsigned not null auto_increment primary key,
    `title`         varchar(256) not null,
    `description`   varchar(16384) not null,
    `ord`           int unsigned not null,
    `createdBy`     bigint unsigned not null,
    `creationTime`  timestamp not null default current_timestamp
) engine=InnoDB;

create table lists (
    `id`            bigint unsigned not null auto_increment primary key,
    `projectId`     bigint unsigned not null,
    `title`         varchar(128) not null,
    `ord`           int unsigned not null,
    `createdBy`     bigint unsigned not null,
    `creationTime`  timestamp not null default current_timestamp,

    index `projectId,ord` (`projectId`, `ord`)
) engine=InnoDB;

create table tasks (
    `id`            bigint unsigned not null auto_increment primary key,
    `listId`        bigint unsigned not null,
    `title`         varchar(256) not null,
    `description`   varchar(4096) not null,
    `ord`           int unsigned not null,
    `status`        tinyint unsigned not null default 1,
    `estimatedHours` int unsigned default null,
    `actualHours`   int unsigned default null,
    `createdBy`     bigint unsigned not null,
    `creationTime`  timestamp not null default current_timestamp,
    `completedBy`   bigint unsigned default null,
    `completionTime` timestamp null default null,

    index `listId,ord` (`listId`,`ord`)
) engine=InnoDB;
