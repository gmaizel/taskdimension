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


-- default user, password is '123456'
insert into users(fullName, login, password) values('User', 'user', '0|41f5367a132b0bab95ce1a7a259a81de8ad700f084cdedf897995b63e958df01|4cc8457a0fba2d04a040e6dd2daf867f6ef69c1a483251d81d34930b04a1ebe0d022f37e101f816fb685c4e260326e5775cfaca194234653cc21814d30c4bb7f');

-- default project
insert into projects(title, description, ord, createdBy) values('My Project', '', 0, 1);
