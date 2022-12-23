<script context="module">
    import { user, equipment as equipmentAPI, character as characterAPI, inventory as inventoryAPI, constants,
        recipe as recipeAPI
    } from "$lib/api/api";
    import ItemButton from "$lib/Item/Button.svelte";
    import Button, { Label, Icon } from "@smui/button";
    import Dialog, { Content as DialogContent, Actions } from '@smui/dialog';
    import Textfield from '@smui/textfield';
    import HelperText from '@smui/textfield/helper-text';
    import Checkbox from '@smui/checkbox';
    import FormField from '@smui/form-field';
    import ItemImage from "$lib/Item/Image.svelte";
    import ItemCatalog from "$lib/Catalog/ItemCatalog.svelte";
    import AmountButtons from "$lib/QuestList/AmountButtons.svelte";
</script>

<script lang="ts">
    interface ItemButtonData {
        id : string; // item id
        amount : number; // amount of items in inventory
        rarity : number; // item rarity, for sorting
    }
    interface DialogData {
        open : boolean; // if modal is shown or not
        id : string; // item id
        amount : number; // amount in dialog input
    }
    let items : ItemButtonData[] = [];
    let edit_dialog_data : DialogData = {
        open: false,
        id: constants.placeholder_id,
        amount: 0,
    };
    let add_dialog_data : DialogData = {
        open: false,
        id: constants.placeholder_id,
        amount: 0,
    };
    let add_item_input : Textfield;
    let delete_dialog_data = {
        open: false,
        confirm: false,
    };

    let rarity_sort : "none" | "desc" | "asc" = "none";
    let amount_sort : "desc" | "asc" = "desc";

    function updateItems() {
        items = [];
        Object.entries(user.inventory.get())
            .forEach(([id, amount]) => {
                items.push({
                    id,
                    amount,
                    rarity: parseInt(equipmentAPI.getRarityFromID(id)),
                });
            });
        // amount sort
        items.sort((a, b) => {
            if (amount_sort === "asc") {
                return a.amount - b.amount; // amount sort, ascending
            }
            return b.amount - a.amount; // amount sort, descending
        });
        // rarity sort
        if (rarity_sort !== "none") {
            items.sort((a, b) => {
                if (rarity_sort === "asc") {
                    return a.rarity - b.rarity; // rarity sort, ascending
                }
                return b.rarity - a.rarity; // rarity sort, descending
            });
        }
    }
    updateItems();

    function openAddItemDialog() {
        add_dialog_data.open = true;
        add_dialog_data.id = constants.placeholder_id;
        add_dialog_data.amount = 0;
    }
    // @ts-ignore - ignoring because event is a CustomEvent and it doesn't have charCode
    function keypressAddItem(event) {
        if (event.charCode === 13) { // on ENTER key press
            completeAddItem();
        }
    }
    function completeAddItem() {
        add_dialog_data.open = false;
        add_dialog_data.amount = Math.floor(add_dialog_data.amount);
        if (isNaN(add_dialog_data.amount) || add_dialog_data.amount <= 0) {
            return;
        }
        // addAmount auto checks for values greater than max
        user.inventory.addAmount(add_dialog_data.id, add_dialog_data.amount);
        updateItems();
    }

    function handleItemClick(id : string) {
        edit_dialog_data.open = true;
        edit_dialog_data.id = id;
        edit_dialog_data.amount = user.inventory.getAmount(id);
    }
    function onchangeInventoryEdit() {
        // don't edit inventory here because then all projects will be checked again
        // and it may be stupidly inefficient
        if (edit_dialog_data.amount <= 0) {
            edit_dialog_data.amount = 0;
            return;
        }
        if (edit_dialog_data.amount > constants.inventory.max.fragment) {
            edit_dialog_data.amount = constants.inventory.max.fragment;
        }
    }
    // @ts-ignore - ignoring because event is a CustomEvent and it doesn't have charCode
    function keypressInventoryEdit(event) {
        if (event.charCode === 13) { // on ENTER key press
            completeInventoryEdit();
        }
    }
    function completeInventoryEdit() {
        edit_dialog_data.open = false;
        edit_dialog_data.amount = Math.floor(edit_dialog_data.amount);
        if (isNaN(edit_dialog_data.amount) || edit_dialog_data.amount <= 0) {
            user.inventory.remove(edit_dialog_data.id);
            updateItems();
            return;
        }
        user.inventory.setAmount(edit_dialog_data.id, edit_dialog_data.amount);
        updateItems();
    }
    function deleteItem() {
        edit_dialog_data.open = false;
        user.inventory.remove(edit_dialog_data.id);
        updateItems();
    }

    function completeDeleteItems() {
        delete_dialog_data.open = false;
        user.inventory.set({});
        updateItems();
    }

    function changeAmountSort() {
        if (amount_sort === "asc") {
            amount_sort = "desc";
        }
        else {
            amount_sort = "asc";
        }
        updateItems();
    }
    function changeRaritySort() {
        if (rarity_sort === "none") {
            rarity_sort = "desc";
        }
        else if (rarity_sort === "desc") {
            rarity_sort = "asc";
        }
        else {
            rarity_sort = "none";
        }
        updateItems();
    }
</script>

<section class="pb-[5vh]">
    <div class="flex flex-col gap-4">
        <div class="my-1 flex flex-col items-center justify-center gap-2">
            <Button variant="raised" class="w-[90vw]" on:click={openAddItemDialog}>
                <Icon class="material-icons">add</Icon>
                <Label>Add Item</Label>
            </Button>
            <div class="flex flex-row gap-1 w-[90vw]">
                <Button color="secondary" variant="raised" class="flex-1"
                    on:click={changeAmountSort}
                >
                    <Label>Sort: Amount</Label>
                    <Icon class="material-icons">
                        {amount_sort === "asc" ? "arrow_drop_up" : "arrow_drop_down"}
                    </Icon>
                </Button>
                <Button color="secondary" variant="raised" class="flex-1"
                    on:click={changeRaritySort}
                >
                    <Label>Sort: Rarity</Label>
                    <Icon class="material-icons">
                        {rarity_sort === "none"
                            ? "block"
                            : (rarity_sort === "desc" ? "arrow_drop_down" : "arrow_drop_up")}
                    </Icon>
                </Button>
                <Button color="secondary" variant="raised" class="flex-1"
                    disabled={items.length <= 0}
                    on:click={() => {
                        delete_dialog_data = {
                            open: true,
                            confirm: false,
                        };
                    }}
                >
                    <Icon class="material-icons">delete_forever</Icon>
                    <Label>Delete All Items</Label>
                </Button>
            </div>

        </div>
        <div class="flex flex-row flex-wrap items-center justify-center gap-1 lg:px-[4rem]">
            {#if items.length > 0}
                {#each items as { id, amount } (`${id}-${amount}`)}
                    <ItemButton {id} click={() => handleItemClick(id)} {amount} />
                {/each}
            {:else}
                <div class="my-1 flex flex-col items-center justify-center gap-2 h-[50vh]">
                    <strong>No items found</strong>
                    <small>Add items using the item catalog.</small>
                    <Button class="mt-4" variant="raised" on:click={openAddItemDialog}>
                        <Icon class="material-icons">add</Icon>
                        <Label>Add Item</Label>
                    </Button>
                </div>
            {/if}
        </div>
    </div>
    <Dialog bind:open={edit_dialog_data.open} class="text-black z-[1001]">
        <!-- z-index needs to be above project contents/overlay/etc -->
        {#if edit_dialog_data.open}
            <ItemImage id={edit_dialog_data.id} props={{
                height: 44,
                width: 44,
                class: "absolute top-1 right-1"
            }} />
            <div class="title pl-2 pt-1">Edit Inventory</div>
            <DialogContent>
                <Textfield bind:value={edit_dialog_data.amount} label="Amount" class="w-full"
                    on:keypress={keypressInventoryEdit}
                    on:change={onchangeInventoryEdit}
                    type="number" input$min="0" input$max={constants.inventory.max.fragment}>
                    <HelperText slot="helper">Amount in inventory</HelperText>
                </Textfield>
                <AmountButtons
                    on:add={(e) => {
                        edit_dialog_data.amount += e.detail.value;
                        onchangeInventoryEdit();
                    }}
                    on:subtract={(e) => {
                        edit_dialog_data.amount -= e.detail.value;
                        onchangeInventoryEdit();
                    }}
                />
            </DialogContent>
            <Actions class="flex flex-col gap-2 w-full">
                <div class="w-full">
                    <Button variant="raised" class="w-full" style="background-color:#D32F2F;"
                        on:click={deleteItem}
                    >
                        <Icon class="material-icons">delete</Icon>
                        <Label>Delete</Label>
                    </Button>
                </div>
                <div class="flex flex-row gap-1 w-full">
                    <div class="flex-1">
                        <Button color="secondary" variant="outlined" class="w-full">
                            <Icon class="material-icons">close</Icon>
                            <Label>Cancel</Label>
                        </Button>
                    </div>
                    <div class="flex-1">
                        <Button on:click={() => completeInventoryEdit()} variant="raised" class="w-full"
                            style="background-color:#1976D2;"
                        >
                            <Icon class="material-icons">done</Icon>
                            <Label>OK</Label>
                        </Button>
                    </div>
                </div>
            </Actions>
        {/if}
    </Dialog>
    <Dialog bind:open={add_dialog_data.open} class="text-black z-[1001]"
        surface$style="min-width: calc(100vw - 64px); min-height: calc(100vh - 32px);"
    >
        <div class="title pl-2 pt-1">Add Item</div>
        <DialogContent class="text-center flex flex-col">
            <div class="flex flex-col select-none gap-1 justify-center items-center p-4 rounded-md mb-3 bg-[rgba(0,0,0,0.1)]">
                {#if add_dialog_data.id !== constants.placeholder_id}
                    <div>
                        <div class="font-bold">{equipmentAPI.name(add_dialog_data.id, user.region.get())}</div>
                        <small>({add_dialog_data.id})</small>
                    </div>
                {/if}
                {#key add_dialog_data.id}
                    <ItemImage id={add_dialog_data.id} props={{
                        height: 64,
                        width: 64,
                    }} />
                {/key}
                <div class="text-left sm:w-[30%]">
                    <Textfield bind:this={add_item_input} bind:value={add_dialog_data.amount} label="Amount" class="w-full"
                        on:keypress={keypressAddItem}
                        on:change={() => {
                            if (add_dialog_data.amount > constants.inventory.max.fragment) {
                                add_dialog_data.amount = constants.inventory.max.fragment;
                            }
                        }}
                        type="number" input$min="0" input$max={constants.inventory.max.fragment}>
                        <HelperText slot="helper">Amount to add to inventory</HelperText>
                    </Textfield>
                </div>
            </div>
            <ItemCatalog show_full show_fragment
                on:select_item={(event) => {
                    if (add_dialog_data.id !== event.detail.data.id) {
                        add_item_input.focus();
                        add_dialog_data.id = event.detail.data.id;
                    }
                    else {
                        if (isNaN(add_dialog_data.amount)) {
                            add_dialog_data.amount = 0;
                        }
                        add_dialog_data.amount++;
                        if (add_dialog_data.amount > constants.inventory.max.fragment) {
                            add_dialog_data.amount = constants.inventory.max.fragment;
                        }
                    }
                }}
            />
        </DialogContent>
        <Actions class="flex flex-row gap-1 w-full">
            <Button color="secondary" variant="outlined" class="flex-1">
                <Icon class="material-icons">close</Icon>
                <Label>Cancel</Label>
            </Button>
            <Button color="primary" variant="raised" class="flex-1"
                disabled={(add_dialog_data.id === constants.placeholder_id) || add_dialog_data.amount <= 0}
                on:click={completeAddItem}
            >
                <Icon class="material-icons">done</Icon>
                <Label>Add Item</Label>
            </Button>
        </Actions>
    </Dialog>
    <Dialog bind:open={delete_dialog_data.open} class="text-black z-[1001]">
        <div class="title pl-2 pt-1">Delete All Items</div>
        <DialogContent class="text-center flex flex-col">
            <div class="pb-4 font-bold">Are you sure you want to <span class="text-red-700 font-bold">delete</span> your entire inventory?</div>
            <FormField class="pb-4">
                <Checkbox bind:checked={delete_dialog_data.confirm} />
                <span slot="label">Yes, <span class="text-red-700 font-bold">delete</span> my inventory.</span>
            </FormField>
            <div>
                <small class="text-red-700 font-bold">Deleted inventories can not be restored.</small>
            </div>
        </DialogContent>
        <Actions class="flex flex-row gap-1 w-full">
            <Button color="secondary" variant="outlined" class="flex-1">
                <Icon class="material-icons">close</Icon>
                <Label>Cancel</Label>
            </Button>
            <Button color="primary" variant="raised" class="flex-1"
                disabled={!delete_dialog_data.confirm}
                on:click={completeDeleteItems}
            >
                <Icon class="material-icons">delete</Icon>
                <Label>Delete All Items</Label>
            </Button>
        </Actions>
    </Dialog>
</section>

<style>
    .title {
        font-weight: 500;
        letter-spacing: 0.2px;
        color: rgba(0, 0, 0, 0.6);
        font-size: 14px;
    }
</style>