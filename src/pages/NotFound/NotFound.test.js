import { render, screen } from '@testing-library/react';
import NotFound from './NotFound';

describe('Make sure the 404 page displays important components', () => {
    test('renders without crashing', () => {
        render(<NotFound />);
    });

    test('renders 404 message', () => {
        render(<NotFound />);
        const linkElement = screen.getByText(/404 - Page Not Found/i);
        expect(linkElement).toBeInTheDocument();
    });

    test('renders return to main page link', () => {
        render(<NotFound />);
        const linkElement = screen.getByText(/Return to Main Page/i);
        expect(linkElement).toBeInTheDocument();
    });
});

