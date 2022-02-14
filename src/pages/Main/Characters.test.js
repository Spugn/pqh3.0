import { render } from '@testing-library/react';
import Characters from './Characters';
import _data from '../../../public/data.min.json';

// minimum amount of data needed to render the page
const data = {
    character: {
        data: _data.character,
    },
};
const userState = {};
const userDispatch = () => {};
const hidden = false;

describe('Make sure the Character page loads', () => {
    test('renders without crashing', () => {
        render(<Characters {...{data, userState, userDispatch, hidden}} />);
    });
});

// no real important components needed to be checked for