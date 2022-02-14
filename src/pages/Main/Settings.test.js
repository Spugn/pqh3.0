import { render, screen, fireEvent } from '@testing-library/react';
import Settings from './Settings';
import _CONSTANTS from '../../scripts/constants';

// minimum amount of data needed to render the page
let userState = {
    settings: {},
};
let userDispatch = () => {};
const hidden = false;

describe('Make sure the Settings page loads', () => {
    test('renders without crashing', () => {
        render(<Settings {...{ userState, userDispatch, hidden }} />);
    });
});

describe('Make sure the setting functionality works', () => {
    // update minimum data with test values
    userState = {
        settings: {
            alert: { sample_alert: true, },
        },
    };
    userDispatch = ({ type, payload }) => {
        switch(type) {
            case 'SET_SETTINGS':
                userState.settings[payload.key] = payload.data;
                return;
            default:
                return;
        }
    };

    test('toggling legacy mode changes settings', () => {
        render(<Settings {...{ userState, userDispatch, hidden }} />);
        const checkbox = screen.getByRole('checkbox', { label: 'Use Legacy Version' });

        fireEvent.click(checkbox); // first click
        expect(userState.settings.use_legacy).toBe(true); // is enabled

        fireEvent.click(checkbox); // 2nd click
        expect(userState.settings.use_legacy).toBe(false); // is disabled
    });

    test('clicking "Reset Tips" will clear userState.settings.alert', () => {
        render(<Settings {...{ userState, userDispatch, hidden }} />);
        const button = screen.getByText(/Reset Tips/i);

        fireEvent.click(button); // first click
        expect(Object.keys(userState.settings.alert).length).toBe(0); // no keys, empty object
    });
})