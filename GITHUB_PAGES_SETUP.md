# Настройка GitHub Pages для статического сайта

Ошибка с Jekyll возникает, когда в репозитории включена сборка через Jekyll (папка `docs` или режим «Deploy from a branch»). Этот проект — обычный статический сайт (HTML/CSS/JS), сборка не нужна.

## Что сделать в настройках репозитория

1. Открой репозиторий **YonaVin/GNTB** на GitHub.
2. Перейди в **Settings** → **Pages** (в левом меню).
3. В блоке **Build and deployment**:
   - в поле **Source** выбери **GitHub Actions** (не «Deploy from a branch»).

После этого GitHub будет использовать workflow из `.github/workflows/pages.yml`: он просто загружает файлы из корня репозитория и публикует их на Pages, без Jekyll.

## Если всё ещё запускается Jekyll

Если после смены Source ошибка «pages build and deployment» с Jekyll остаётся:

1. Зайди в **Actions**.
2. В списке workflow слева найди **«pages build and deployment»** (или похожее имя с Jekyll).
3. Нажми на него → справа **⋯** (три точки) → **Disable workflow**.

Дальше будет выполняться только workflow **«Deploy static site to GitHub Pages»**, и сайт будет открываться по адресу вида:  
`https://yonavin.github.io/GNTB/`
