import { render, screen } from '@testing-library/react';
import Main from './Main';

describe('Make sure the Main page loads', () => {
    test('renders without crashing', () => {
        render(<Main />);
    });
});

describe('Make sure important components exist', () => {
    test('renders loading screen', () => {
        const result = render(<Main />);

        // loading div is on page?
        const loadingDIV = result.container.querySelector('#loading-div');
        expect(loadingDIV).toBeInTheDocument();

        // body has the "loading-screen--show" class?
        const body = document.querySelector('body');
        expect(body.classList.contains('loading-screen--show')).toBe(true);
    });

    test('renders burger menu', () => {
        render(<Main />);

        const openButton = screen.getByText(/Open Menu/i);
        expect(openButton).toBeInTheDocument();

        const closeButton = screen.getByText(/Close Menu/i);
        expect(closeButton).toBeInTheDocument();
    });

    test('renders title', () => {
        render(<Main />);

        const mainTitle = screen.getByText(/Princess Connect! Re:Dive/i);
        expect(mainTitle).toBeInTheDocument();

        const subTitle = screen.getByText(/Quest Helper/i);
        expect(subTitle).toBeInTheDocument();
    });
});