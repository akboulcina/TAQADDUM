# ADR-001 — NestJS + Fastify + TypeScript

## Décision

Le backend Release 0 utilise TypeScript strict, NestJS et Fastify.

## Raisons

NestJS fournit modules, injection, guards et conventions API ; Fastify fournit un runtime HTTP performant ; TypeScript strict unifie API, worker et contrats techniques.

## Alternatives

Spring Boot est robuste mais introduit une seconde chaîne de langage. Fastify seul est plus léger mais impose davantage de conventions locales. Express est écarté au profit de Fastify.

## Conséquences

Le domaine reste indépendant du framework. Les contrôleurs restent minces et les frontières de modules sont vérifiées en CI. L’équipe doit maîtriser TypeScript strict, NestJS et Fastify.
