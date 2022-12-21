import { publish } from 'gh-pages';

// btw you need a file named ".nojekyll" for github-pages to properly work.
publish(
    'build',
    {
        branch: 'gh-pages',
        repo: 'https://github.com/Spugn/priconne-quest-helper.git',
        user: {
            name: "S'pugn",
            email: 'Expugn@users.noreply.github.com'
        },
        dotfiles: true
    },
    () => {
        console.log('Deployed to GitHub Pages.');
    }
);