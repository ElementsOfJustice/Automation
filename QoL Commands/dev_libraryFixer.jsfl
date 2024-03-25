var library = fl.getDocumentDOM().library;
for (var i = 0; i < library.items.length; i++) {
    if (library.items[i] instanceof SymbolItem && library.items[i].timeline.name.indexOf("/") != -1) {
        fl.trace("FIXED: " + library.items[i].name);
        library.items[i].timeline.name = library.items[i].timeline.name.substring(library.items[i].timeline.name.lastIndexOf("/") + 1, library.items[i].timeline.name.length);
    }
}