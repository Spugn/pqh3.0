import { render, screen } from '@testing-library/react';
import Inventory from './Inventory';
import data_utils from '../../scripts/data_utils';
import _data from '../../../public/data.min.json';

// minimum amount of data needed to render the page
const data = {
    equipment: {
        data: _data.equipment,
    },
};
const dataUtils = data_utils(data);
const userState = {};
const userDispatch = () => {};
const hidden = false;

describe('Make sure the Inventory page loads', () => {
    test('renders without crashing', () => {
        render(<Inventory {...{data, dataUtils, userState, userDispatch, hidden}} />);
    });
});

describe('Make sure the inventory displays important components', () => {
    test('renders add item button', () => {
        render(<Inventory {...{data, dataUtils, userState, userDispatch, hidden}} />);

        const button = screen.getByText(/Add Item/i);
        expect(button).toBeInTheDocument();
    });

    test('renders item catalog modal', () => {
        render(<Inventory {...{data, dataUtils, userState, userDispatch, hidden}} />);

        const selectItemStep = screen.getByText(/Select Item/i);
        expect(selectItemStep).toBeInTheDocument();

        const selectAmountStep = screen.getByText(/Select Amount/i);
        expect(selectAmountStep).toBeInTheDocument();
    });
});