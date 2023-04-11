# Commands

Commands are the way to make changes to the state. They are dispatched to the model, which relay them to each plugins.

There are two kinds of commands: `CoreCommands` and `LocalCommands`.

1. `CoreCommands` are commands that

   - manipulate the imported/exported spreadsheet state
   - are shared in collaborative environment

1. `LocalCommands`: every other command
   - manipulate the local state
   - can be converted into CoreCommands
   - are not shared in collaborative environment

For example, "RESIZE_COLUMNS_ROWS" is a CoreCommand. "AUTORESIZE_COLUMNS" can be (locally) converted into a "RESIZE_COLUMNS_ROWS", and therefore, is not a CoreCommand.
CoreCommands should be "device agnostic". This means that they should contain all the information necessary to perform their job. Local commands can use inferred information from the local internal state, such as the active sheet.

To declare a new `CoreCommands`, its type should be added to `CoreTypes`:

```js
const { coreTypes } = o_spreadsheet;

coreTypes.add("MY_COMMAND_NAME");
```

Adding the type to `CoreTypes` is necessary to identify the new command as a `CoreCommands`, and so to ensure that it will be shared.

In readonly mode, the commands are cancelled with the `CommandResult` `Readonly`. However, some commands still need to be executed. For example, the selection should still be updated.
To declare that a new command should be executed in readonly mode, its type should be added to `readonlyAllowedCommands`

```js
const { readonlyAllowedCommands } = o_spreadsheet;
readonlyAllowedCommands.add("MY_COMMAND_NAME");
```

## Reserved keywords in commands

Some parameters in command payload are reserved, and should always have the same meaning and type each time they appear in a command. Those are :

- `sheetId` : should be a string that is an id of a valid sheet
- `col`/`row`: should be numbers describing a valid sheet position
- `zone` : should be a valid `Zone`
- `target` : should be a valid array of `Zone`
- `ranges`: should be a valid array of `RangeData`

The validity of these parameters will be tested in the `allowDispatch` of `SheetPlugin` and `SheetUIPlugin`.
A `sheetId` is valid if the sheet it refers to exists. The other parameters are valid if they describe a valid position in the sheet. For local commands, if `sheetId` is not in the command, the active sheet id will be used instead to check the validity of a position.

An exception is made for the `sheetId` parameter of the `CREATE_SHEET` command, that isn't checked since the sheet doesn't exist yet.
