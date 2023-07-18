# 학교 생활을 관리하는 똑똑한 방법, 스쿨메이트(Schoolmate)🏫

<div align="center">
    <img src="https://github.com/School-Mate/School-Mate-Backend/assets/86834898/aaa36ee6-625a-4038-92be-afd6c9256144" width=400>
</div>

<br><br>

## 기술 스택
- **Language**: Typescript
- **Library & Framework**: Node.js, Express
- **Database**: Prisma(PostgreSQL)
- **Deploy**: AWS EC2(Lightsail), AWS S3, Docker, Jenkins

<br>

## Git Commit Convention
```markdown
feat: 기능추가
fix: 버그수정
refactor: 코드 리팩토링
style: 코드 포맷팅, 타이핑, 린팅관련(세미콜론 누락, 코드 변경X, 주석 추가 및 변경 등등)
rename: 파일 혹은 폴더명을 수정하거나 옮기는 작업
chore: 개발환경관련
test: 테스트 코드
perf: 퍼포먼스 향상
release: 릴리즈
```

<br>

## Foldering
```markdown
📦src
 ┣ 📂config
 ┃ ┗ 📜index.ts
 ┣ 📂controllers
 ┃ ┣ 📜admin.controller.ts
 ┃ ┣ 📜asked.controller.ts
 ┃ ┣ 📜auth.controller.ts
 ┃ ┣ 📜board.controller.ts
 ┃ ┣ 📜bus.controller.ts
 ┃ ┣ 📜index.controller.ts
 ┃ ┣ 📜report.controller.ts
 ┃ ┗ 📜school.controller.ts
 ┣ 📂dtos
 ┃ ┣ 📜admin.dto.ts
 ┃ ┣ 📜article.dto.ts
 ┃ ┣ 📜asked.dto.ts
 ┃ ┣ 📜board.dto.ts
 ┃ ┣ 📜bus.dto.ts
 ┃ ┣ 📜comment.dto.ts
 ┃ ┣ 📜report.dto.ts
 ┃ ┣ 📜school.dto.ts
 ┃ ┗ 📜users.dto.ts
 ┣ 📂exceptions
 ┃ ┗ 📜HttpException.ts
 ┣ 📂http
 ┃ ┣ 📜auth.http
 ┃ ┗ 📜users.http
 ┣ 📂interfaces
 ┃ ┣ 📜admin.interface.ts
 ┃ ┣ 📜auth.interface.ts
 ┃ ┣ 📜board.interface.ts
 ┃ ┣ 📜busapi.interface.ts
 ┃ ┣ 📜kakao.interface.ts
 ┃ ┣ 📜neisapi.interface.ts
 ┃ ┣ 📜routes.interface.ts
 ┃ ┗ 📜school.interface.ts
 ┣ 📂middlewares
 ┃ ┣ 📜admin.middleware.ts
 ┃ ┣ 📜auth.middleware.ts
 ┃ ┣ 📜error.middleware.ts
 ┃ ┣ 📜logger.middleware.ts
 ┃ ┗ 📜validation.middleware.ts
 ┣ 📂prisma
 ┃ ┣ 📂migrations
 ┃ ┃ ┣ 📂20230629084300_
 ┃ ┃ ┃ ┗ 📜migration.sql
 ┃ ┃ ┣ 📂20230629124829_
 ┃ ┃ ┃ ┗ 📜migration.sql
 ┃ ┃ ┣ 📂20230629124938_
 ┃ ┃ ┃ ┗ 📜migration.sql
 ┃ ┃ ┣ 📂20230629135443_
 ┃ ┃ ┃ ┗ 📜migration.sql
 ┃ ┃ ┣ 📂20230629140214_
 ┃ ┃ ┃ ┗ 📜migration.sql
 ┃ ┃ ┣ 📂20230629140618_
 ┃ ┃ ┃ ┗ 📜migration.sql
 ┃ ┃ ┣ 📂20230630094107_
 ┃ ┃ ┃ ┗ 📜migration.sql
 ┃ ┃ ┣ 📂20230630094328_
 ┃ ┃ ┃ ┗ 📜migration.sql
 ┃ ┃ ┣ 📂20230630153935_
 ┃ ┃ ┃ ┗ 📜migration.sql
 ┃ ┃ ┣ 📂20230630154629_
 ┃ ┃ ┃ ┗ 📜migration.sql
 ┃ ┃ ┣ 📂20230701102911_
 ┃ ┃ ┃ ┗ 📜migration.sql
 ┃ ┃ ┣ 📂20230701155238_
 ┃ ┃ ┃ ┗ 📜migration.sql
 ┃ ┃ ┣ 📂20230701160652_
 ┃ ┃ ┃ ┗ 📜migration.sql
 ┃ ┃ ┣ 📂20230707020440_
 ┃ ┃ ┃ ┣ 📜migration 2.sql
 ┃ ┃ ┃ ┗ 📜migration.sql
 ┃ ┃ ┣ 📂20230709044607_
 ┃ ┃ ┃ ┗ 📜migration.sql
 ┃ ┃ ┣ 📂20230709045800_
 ┃ ┃ ┃ ┗ 📜migration.sql
 ┃ ┃ ┣ 📂20230709051312_
 ┃ ┃ ┃ ┗ 📜migration.sql
 ┃ ┃ ┣ 📂20230709051646_
 ┃ ┃ ┃ ┗ 📜migration.sql
 ┃ ┃ ┣ 📂20230709113740_
 ┃ ┃ ┃ ┗ 📜migration.sql
 ┃ ┃ ┣ 📂20230710015902_
 ┃ ┃ ┃ ┗ 📜migration.sql
 ┃ ┃ ┣ 📂20230710020652_
 ┃ ┃ ┃ ┗ 📜migration.sql
 ┃ ┃ ┣ 📂20230710021631_
 ┃ ┃ ┃ ┗ 📜migration.sql
 ┃ ┃ ┣ 📂20230710021711_
 ┃ ┃ ┃ ┗ 📜migration.sql
 ┃ ┃ ┣ 📂20230710022639_
 ┃ ┃ ┃ ┗ 📜migration.sql
 ┃ ┃ ┣ 📂20230710022922_
 ┃ ┃ ┃ ┗ 📜migration.sql
 ┃ ┃ ┣ 📂20230710035134_
 ┃ ┃ ┃ ┗ 📜migration.sql
 ┃ ┃ ┣ 📂20230710035230_
 ┃ ┃ ┃ ┗ 📜migration.sql
 ┃ ┃ ┣ 📂20230710085325_
 ┃ ┃ ┃ ┗ 📜migration.sql
 ┃ ┃ ┣ 📂20230711061014_
 ┃ ┃ ┃ ┗ 📜migration.sql
 ┃ ┃ ┣ 📂20230711130936_
 ┃ ┃ ┃ ┗ 📜migration.sql
 ┃ ┃ ┣ 📂20230711131157_
 ┃ ┃ ┃ ┗ 📜migration.sql
 ┃ ┃ ┣ 📂20230711131219_
 ┃ ┃ ┃ ┗ 📜migration.sql
 ┃ ┃ ┣ 📂20230712020829_
 ┃ ┃ ┃ ┗ 📜migration.sql
 ┃ ┃ ┣ 📂20230712030502_
 ┃ ┃ ┃ ┗ 📜migration.sql
 ┃ ┃ ┣ 📂20230712033426_
 ┃ ┃ ┃ ┗ 📜migration.sql
 ┃ ┃ ┣ 📂20230712053458_
 ┃ ┃ ┃ ┗ 📜migration.sql
 ┃ ┃ ┣ 📂20230712091729_
 ┃ ┃ ┃ ┗ 📜migration.sql
 ┃ ┃ ┣ 📂20230712092914_
 ┃ ┃ ┃ ┗ 📜migration.sql
 ┃ ┃ ┣ 📂20230712154257_
 ┃ ┃ ┃ ┗ 📜migration.sql
 ┃ ┃ ┣ 📂20230712161553_
 ┃ ┃ ┃ ┗ 📜migration.sql
 ┃ ┃ ┣ 📂20230713011002_
 ┃ ┃ ┃ ┗ 📜migration.sql
 ┃ ┃ ┣ 📂20230713033351_
 ┃ ┃ ┃ ┗ 📜migration.sql
 ┃ ┃ ┣ 📂20230713034239_
 ┃ ┃ ┃ ┗ 📜migration.sql
 ┃ ┃ ┣ 📂20230713034623_
 ┃ ┃ ┃ ┗ 📜migration.sql
 ┃ ┃ ┣ 📂20230713061922_
 ┃ ┃ ┃ ┗ 📜migration.sql
 ┃ ┃ ┣ 📂20230714020027_
 ┃ ┃ ┃ ┗ 📜migration.sql
 ┃ ┃ ┣ 📂20230714025810_
 ┃ ┃ ┃ ┗ 📜migration.sql
 ┃ ┃ ┣ 📂20230714025936_
 ┃ ┃ ┃ ┗ 📜migration.sql
 ┃ ┃ ┣ 📂20230715064429_
 ┃ ┃ ┃ ┗ 📜migration.sql
 ┃ ┃ ┣ 📂20230716091508_
 ┃ ┃ ┃ ┗ 📜migration.sql
 ┃ ┃ ┣ 📂20230716100735_
 ┃ ┃ ┃ ┗ 📜migration.sql
 ┃ ┃ ┣ 📂20230716133601_
 ┃ ┃ ┃ ┗ 📜migration.sql
 ┃ ┃ ┣ 📂20230717023309_
 ┃ ┃ ┃ ┗ 📜migration.sql
 ┃ ┃ ┣ 📂20230717034326_
 ┃ ┃ ┃ ┗ 📜migration.sql
 ┃ ┃ ┣ 📂20230717053832_
 ┃ ┃ ┃ ┗ 📜migration.sql
 ┃ ┃ ┣ 📂20230717063645_
 ┃ ┃ ┃ ┗ 📜migration.sql
 ┃ ┃ ┣ 📂20230717152805_
 ┃ ┃ ┃ ┗ 📜migration.sql
 ┃ ┃ ┣ 📂20230717172915_
 ┃ ┃ ┃ ┗ 📜migration.sql
 ┃ ┃ ┗ 📜migration_lock.toml
 ┃ ┗ 📜schema.prisma
 ┣ 📂routes
 ┃ ┣ 📜admin.route.ts
 ┃ ┣ 📜asked.route.ts
 ┃ ┣ 📜auth.route.ts
 ┃ ┣ 📜board.route.ts
 ┃ ┣ 📜bus.route.ts
 ┃ ┣ 📜index.route.ts
 ┃ ┣ 📜report.route.ts
 ┃ ┗ 📜school.route.ts
 ┣ 📂services
 ┃ ┣ 📜admin.service.ts
 ┃ ┣ 📜asked.service.ts
 ┃ ┣ 📜auth.service.ts
 ┃ ┣ 📜board.service.ts
 ┃ ┣ 📜bus.service.ts
 ┃ ┣ 📜report.service.ts
 ┃ ┗ 📜school.service.ts
 ┣ 📂tests
 ┃ ┣ 📜auth.test.ts
 ┃ ┣ 📜index.test.ts
 ┃ ┗ 📜users.test.ts
 ┣ 📂utils
 ┃ ┣ 📜client.ts
 ┃ ┣ 📜logger.ts
 ┃ ┣ 📜multer.ts
 ┃ ┣ 📜responseWarpper.ts
 ┃ ┣ 📜util.ts
 ┃ ┗ 📜validateEnv.ts
 ┣ 📜app.ts
 ┗ 📜server.ts
```