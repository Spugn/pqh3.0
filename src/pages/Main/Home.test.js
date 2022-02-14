import { render, screen } from '@testing-library/react';
import Home from './Home';
import _data from '../../../public/data.min.json';

// minimum amount of data needed to render the page
const data = {
    quest: {
        max_chapter: -1,
    }
};
const userState = {
    projects: [],
    settings: {},
};
const userDispatch = () => {};
const hidden = false;

describe('Make sure the Home page loads', () => {
    test('renders without crashing', () => {
        render(<Home {...{data, userState, userDispatch, hidden}} />);
    });
});

describe('Check if Home page rendered important components', () => {
    test('renders miyako menu tip', () => {
        render(<Home {...{data, userState, userDispatch, hidden}} />);
        const miyakoTip = screen.getByText(/Click on the Miyako icon/i);
        expect(miyakoTip).toBeInTheDocument();
    });

    test('renders new project modal', () => {
        render(<Home {...{data, userState, userDispatch, hidden}} />);
        const modal = screen.getByText(/Choose the type of project you want to create/i);
        expect(modal).toBeInTheDocument();
    });
});