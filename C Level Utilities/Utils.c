#include <TChar.h>
#include "mm_jsapi.h" 
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <git2.h>
#include <time.h>

int resolve_refish(git_annotated_commit** commit, git_repository* repo, const char* refish)
{
	git_reference* ref;
	git_object* obj;
	int err = 0;

	err = git_reference_dwim(&ref, repo, refish);
	if (err == GIT_OK) {
		git_annotated_commit_from_ref(commit, repo, ref);
		git_reference_free(ref);
		return 0;
	}

	err = git_revparse_single(&obj, repo, refish);
	if (err == GIT_OK) {
		err = git_annotated_commit_lookup(commit, repo, git_object_id(obj));
		git_object_free(obj);
	}

	return err;
}

void check_lg2(int error, const char* message, const char* extra)
{
//	lg2err;
	const char* lg2msg = "", * lg2spacer = "";

	if (!error)
		return;

	//if ((lg2err = git_error_last()) != NULL && lg2err->message != NULL) {
	//	lg2msg = lg2err->message;
	//	lg2spacer = " - ";
	//}

	//if (extra)
	//	fprintf(stderr, "%s '%s' [%d]%s%s\n",
	//		message, extra, error, lg2spacer, lg2msg);
	//else
	//	fprintf(stderr, "%s [%d]%s%s\n",
	//		message, error, lg2spacer, lg2msg);
	//exit(1);
}

void* xrealloc(void* oldp, size_t newsz)
{
	void* p = realloc(oldp, newsz);
	if (p == NULL) {
		fprintf(stderr, "Cannot allocate memory, exiting.\n");
		exit(1);
	}
	return p;
}

struct args_info {
	int    argc;
	char** argv;
	int    pos;
	int    opts_done : 1;
};
#define ARGS_INFO_INIT { argc, argv, 0, 0 }
#define ARGS_CURRENT(args) args->argv[args->pos]

struct merge_options {
	const char** heads;
	size_t heads_count;

	git_annotated_commit** annotated;
	size_t annotated_count;

	int no_commit : 1;
};

static void print_usage(void)
{
	fprintf(stderr, "usage: merge [--no-commit] <commit...>\n");
	exit(1);
}

static void merge_options_init(struct merge_options* opts)
{
	memset(opts, 0, sizeof(*opts));

	opts->heads = NULL;
	opts->heads_count = 0;
	opts->annotated = NULL;
	opts->annotated_count = 0;
}

static void opts_add_refish(struct merge_options* opts, const char* refish)
{
	size_t sz;


	sz = ++opts->heads_count * sizeof(opts->heads[0]);
	opts->heads = xrealloc((void*)opts->heads, sz);
	opts->heads[opts->heads_count - 1] = refish;
}

static void parse_options(const char** repo_path, struct merge_options* opts, int argc, char** argv)
{
	struct args_info args = ARGS_INFO_INIT;

	if (argc <= 1)
		print_usage();

	for (args.pos = 1; args.pos < argc; ++args.pos) {
		const char* curr = argv[args.pos];

		if (curr[0] != '-') {
			opts_add_refish(opts, curr);
		}
		else if (!strcmp(curr, "--no-commit")) {
			opts->no_commit = 1;
		}
		else {
			print_usage();
		}
	}
}

static int resolve_heads(git_repository* repo, struct merge_options* opts)
{
	git_annotated_commit** annotated = calloc(opts->heads_count, sizeof(git_annotated_commit*));
	size_t annotated_count = 0, i;
	int err = 0;

	for (i = 0; i < opts->heads_count; i++) {
		err = resolve_refish(&annotated[annotated_count++], repo, opts->heads[i]);
		if (err != 0) {
			//fprintf(stderr, "failed to resolve refish %s: %s\n", opts->heads[i], git_error_last()->message);
			annotated_count--;
			continue;
		}
	}

	if (annotated_count != opts->heads_count) {
		fprintf(stderr, "unable to parse some refish\n");
		free(annotated);
		return -1;
	}

	opts->annotated = annotated;
	opts->annotated_count = annotated_count;
	return 0;
}

static int perform_fastforward(git_repository* repo, const git_oid* target_oid, int is_unborn)
{
	git_checkout_options ff_checkout_options = GIT_CHECKOUT_OPTIONS_INIT;
	git_reference* target_ref;
	git_reference* new_target_ref;
	git_object* target = NULL;
	int err = 0;

	if (is_unborn) {
		const char* symbolic_ref;
		git_reference* head_ref;

		err = git_reference_lookup(&head_ref, repo, "HEAD");
		if (err != 0) {
			fprintf(stderr, "failed to lookup HEAD ref\n");
			return -1;
		}

		symbolic_ref = git_reference_symbolic_target(head_ref);

		err = git_reference_create(&target_ref, repo, symbolic_ref, target_oid, 0, NULL);
		if (err != 0) {
			fprintf(stderr, "failed to create master reference\n");
			return -1;
		}

		git_reference_free(head_ref);
	}
	else {
		err = git_repository_head(&target_ref, repo);
		if (err != 0) {
			fprintf(stderr, "failed to get HEAD reference\n");
			return -1;
		}
	}

	err = git_object_lookup(&target, repo, target_oid, GIT_OBJECT_COMMIT);
	if (err != 0) {
		fprintf(stderr, "failed to lookup OID %s\n", git_oid_tostr_s(target_oid));
		return -1;
	}

	ff_checkout_options.checkout_strategy = GIT_CHECKOUT_FORCE;
	err = git_checkout_tree(repo, target, &ff_checkout_options);
	if (err != 0) {
		fprintf(stderr, "failed to checkout HEAD reference\n");
		return -1;
	}

	err = git_reference_set_target(&new_target_ref, target_ref, target_oid, NULL);
	if (err != 0) {
		fprintf(stderr, "failed to move HEAD reference\n");
		return -1;
	}

	git_reference_free(target_ref);
	git_reference_free(new_target_ref);
	git_object_free(target);

	return 0;
}

static void output_conflicts(git_index* index)
{
	git_index_conflict_iterator* conflicts;
	const git_index_entry* ancestor;
	const git_index_entry* our;
	const git_index_entry* their;
	int err = 0;

	check_lg2(git_index_conflict_iterator_new(&conflicts, index), "failed to create conflict iterator", NULL);

	while ((err = git_index_conflict_next(&ancestor, &our, &their, conflicts)) == 0) {
		fprintf(stderr, "conflict: a:%s o:%s t:%s\n",
			ancestor ? ancestor->path : "NULL",
			our->path ? our->path : "NULL",
			their->path ? their->path : "NULL");
	}

	if (err != GIT_ITEROVER) {
		fprintf(stderr, "error iterating conflicts\n");
	}

	git_index_conflict_iterator_free(conflicts);
}

static int create_merge_commit(git_repository* repo, git_index* index, struct merge_options* opts)
{
	git_oid tree_oid, commit_oid;
	git_tree* tree;
	git_signature* sign;
	git_reference* merge_ref = NULL;
	git_annotated_commit* merge_commit;
	git_reference* head_ref;
	git_commit** parents = calloc(opts->annotated_count + 1, sizeof(git_commit*));
	const char* msg_target = NULL;
	size_t msglen = 0;
	char* msg;
	size_t i;
	int err;
	check_lg2(git_repository_head(&head_ref, repo), "failed to get repo HEAD", NULL);
	if (resolve_refish(&merge_commit, repo, opts->heads[0])) {
		fprintf(stderr, "failed to resolve refish %s", opts->heads[0]);
		free(parents);
		return -1;
	}

	err = git_reference_dwim(&merge_ref, repo, opts->heads[0]);
	//check_lg2(err, "failed to DWIM reference", git_error_last()->message);

	check_lg2(git_signature_now(&sign, "Me", "me@example.com"), "failed to create signature", NULL);

#define MERGE_COMMIT_MSG "Merge %s '%s'"
	if (merge_ref != NULL) {
		check_lg2(git_branch_name(&msg_target, merge_ref), "failed to get branch name of merged ref", NULL);
	}
	else {
		msg_target = git_oid_tostr_s(git_annotated_commit_id(merge_commit));
	}

	msglen = snprintf(NULL, 0, MERGE_COMMIT_MSG, (merge_ref ? "branch" : "commit"), msg_target);
	if (msglen > 0) msglen++;
	msg = malloc(msglen);
	err = snprintf(msg, msglen, MERGE_COMMIT_MSG, (merge_ref ? "branch" : "commit"), msg_target);

	if (err < 0) goto cleanup;

	err = git_reference_peel((git_object**)&parents[0], head_ref, GIT_OBJECT_COMMIT);
	check_lg2(err, "failed to peel head reference", NULL);
	for (i = 0; i < opts->annotated_count; i++) {
		git_commit_lookup(&parents[i + 1], repo, git_annotated_commit_id(opts->annotated[i]));
	}

	check_lg2(git_index_write_tree(&tree_oid, index), "failed to write merged tree", NULL);
	check_lg2(git_tree_lookup(&tree, repo, &tree_oid), "failed to lookup tree", NULL);

	err = git_commit_create(&commit_oid,
		repo, git_reference_name(head_ref),
		sign, sign,
		NULL, msg,
		tree,
		opts->annotated_count + 1, (const git_commit**)parents);
	check_lg2(err, "failed to create commit", NULL);

	git_repository_state_cleanup(repo);

cleanup:
	free(parents);
	return err;
}

int lg2_merge(git_repository* repo)
{
	int argc = 2;
	char** argv[2] = { "merge", "origin/main" };
	struct merge_options opts;
	git_index* index;
	git_repository_state_t state;
	git_merge_analysis_t analysis;
	git_merge_preference_t preference;
	const char* path = ".";
	int err = 0;

	merge_options_init(&opts);
	parse_options(&path, &opts, argc, argv);

	state = git_repository_state(repo);
	if (state != GIT_REPOSITORY_STATE_NONE) {
		fprintf(stderr, "repository is in unexpected state %d\n", state);
		goto cleanup;
	}

	err = resolve_heads(repo, &opts);
	if (err != 0)
		goto cleanup;

	err = git_merge_analysis(&analysis, &preference,
		repo,
		(const git_annotated_commit**)opts.annotated,
		opts.annotated_count);
	check_lg2(err, "merge analysis failed", NULL);

	if (analysis & GIT_MERGE_ANALYSIS_UP_TO_DATE) {
		printf("Already up-to-date\n");
		return 0;
	}
	else if (analysis & GIT_MERGE_ANALYSIS_UNBORN ||
		(analysis & GIT_MERGE_ANALYSIS_FASTFORWARD &&
			!(preference & GIT_MERGE_PREFERENCE_NO_FASTFORWARD))) {
		const git_oid* target_oid;
		if (analysis & GIT_MERGE_ANALYSIS_UNBORN) {
			printf("Unborn\n");
		}
		else {
			printf("Fast-forward\n");
		}

		target_oid = git_annotated_commit_id(opts.annotated[0]);

		return perform_fastforward(repo, target_oid, (analysis & GIT_MERGE_ANALYSIS_UNBORN));
	}
	else if (analysis & GIT_MERGE_ANALYSIS_NORMAL) {
		git_merge_options merge_opts = GIT_MERGE_OPTIONS_INIT;
		git_checkout_options checkout_opts = GIT_CHECKOUT_OPTIONS_INIT;

		merge_opts.flags = 0;
		merge_opts.file_flags = GIT_MERGE_FILE_STYLE_DIFF3;

		checkout_opts.checkout_strategy = GIT_CHECKOUT_FORCE;

		if (preference & GIT_MERGE_PREFERENCE_FASTFORWARD_ONLY) {
			printf("Fast-forward is preferred, but only a merge is possible\n");
			return -1;
		}

		err = git_merge(repo,
			(const git_annotated_commit**)opts.annotated, opts.annotated_count,
			&merge_opts, &checkout_opts);
		check_lg2(err, "merge failed", NULL);
	}


	check_lg2(git_repository_index(&index, repo), "failed to get repository index", NULL);

	if (git_index_has_conflicts(index)) {
		output_conflicts(index);
	}
	else if (!opts.no_commit) {
		create_merge_commit(repo, index, &opts);
		printf("Merge made\n");
	}
cleanup:
	free((char**)opts.heads);
	free(opts.annotated);

	return 0;
}

JSBool getFLACLength(JSContext* cx, JSObject* obj, unsigned int argc, jsval* argv, jsval* rval)
{
    unsigned int wasteOfMemory = 0; // I suck with C but this works to create a string ;-;
    unsigned short* x = JS_ValueToString(cx, argv[0], &wasteOfMemory);
    char* filename = (char*)malloc(wasteOfMemory + 1); // allocate memory for filename
    FILE* fp; // prepare file to read from
    int c, i, max; // looping variables
    unsigned long sampleRate = 0, samples = 0; // file metadata variables
    for (int i = 0; i < wasteOfMemory; i++) {
        filename[i] = (char)x[i]; // get filename 
    }
    filename[wasteOfMemory] = '\0'; // null terminator at the end of string
    int err = fopen_s(&fp, filename, "rb"); // open the file
    if (err != 0) {
        *rval = JS_IntegerToValue(-1);
        return JS_TRUE; // return -1 as an error value so that it doesn't crash.
    }
    for (i = 0, max = 0x20; i < max && (c = getc(fp)) != EOF; i++) { // loop over first 32 bytes of the file
        if ((i >= 0x12 && i <= 0x14) || (i >= 0x15 && i <= 0x19)) {
            if (i >= 0x12 && i <= 0x14) { // FLAC documentation says that the sample rate is from byte 0x12 to the first nibble of byte 0x14
                sampleRate <<= (i == 0x14) ? 4 : 8;
                sampleRate += (i == 0x14) ? c & 0b11110000 : c;
            }
        }
        if (i >= 0x15 && i <= 0x19) { // FLAC documentation says that the number of samples is from the second nibble of byte 0x15 to the end of byte 0x19
            samples <<= 8;
            samples += (i == 0x15) ? c & 0b00001111 : c;
        }

    }
    int time = 1000 * (1.0f * samples / (1.0f * sampleRate)); // the duration of a sound file is the number of samples divided by the sample rate. Truncate to the nearest millisecond
    fclose(fp);

    *rval = JS_IntegerToValue(time); // return the duration of the FLAC file in milliseconds
    free(filename); // free memory alloated for the string
    // Indicate success
    return JS_TRUE;
}
// Takes in a string from JSFL and returns it to JSFL
JSBool stringExample(JSContext* cx, JSObject* obj, unsigned int fargc, jsval* argv, jsval* rval) {
    unsigned int size = 0;
    unsigned short* jsString = JS_ValueToString(cx, argv[0], &size);
    char* toReturn = malloc(size + 1);
    for (int i = 0; i < size; i++) {
        toReturn[i] = (char)jsString[i];
    }
    toReturn[size] = '\0';
    JS_StringToValue(cx, toReturn, size, rval);
    free(toReturn);
    return JS_TRUE;
}

static int gitPull(const char* repoPath) {
    git_libgit2_init();
    git_repository* repo;
    git_remote* remote;

    git_repository_open(&repo, repoPath);
    git_fetch_options fetch_opts = GIT_FETCH_OPTIONS_INIT;
    git_checkout_options checkout_opts = GIT_CHECKOUT_OPTIONS_INIT;
    checkout_opts.checkout_strategy = GIT_CHECKOUT_FORCE;
    git_merge_options merge_opts = GIT_MERGE_OPTIONS_INIT;
    git_commit* remote_head_commit = NULL;
    git_reference* remote_head = NULL;
    git_commit* head_commit = NULL;
    git_reference* head = NULL;
	git_error* err = NULL;

    int error = git_remote_lookup(&remote, repo, "origin");
    if (error < 0) {
        err = giterr_last();
        printf("Error looking up remote: %d/%s\n", err->klass, err->message);
        goto cleanup;
    }

    error = git_remote_fetch(remote, NULL, &fetch_opts, NULL);
    if (error < 0) {
        err = giterr_last();
        printf("Error fetching from remote: %d/%s\n", err->klass, err->message);
        goto cleanup;
    }

    git_checkout_index(repo, NULL, &checkout_opts);
    if (error < 0) {
        err = giterr_last();
        printf("Error checking out index: %d/%s\n", err->klass, err->message);
        goto cleanup;
    }

    error = git_repository_head(&head, repo);
    if (error < 0) {
        err = giterr_last();
        printf("Error getting HEAD reference: %d/%s\n", err->klass, err->message);
        goto cleanup;
    }

    error = git_commit_lookup(&head_commit, repo, git_reference_target(head));
    if (error < 0) {
        err = giterr_last();
        printf("Error looking up HEAD commit: %d/%s\n", err->klass, err->message);
        goto cleanup;
    }

    error = git_reference_lookup(&remote_head, repo, "refs/remotes/origin/main");
    if (error < 0) {
        err = giterr_last();
        printf("Error looking up remote HEAD reference: %d/%s\n", err->klass, err->message);
        goto cleanup;
    }

    error = git_commit_lookup(&remote_head_commit, repo, git_reference_target(remote_head));
    if (error < 0) {
        err = giterr_last();
        printf("Error looking up remote HEAD commit: %d/%s\n", err->klass, err->message);
        goto cleanup;
    }

    error = lg2_merge(repo);
    if (error < 0) {
        err = giterr_last();
        printf("Error: %d/%s\n", err->klass, err->message);
        goto cleanup;
    }
cleanup:
    git_commit_free(head_commit);
    git_reference_free(head);
    git_commit_free(remote_head_commit);
    git_reference_free(remote_head);
    git_remote_free(remote);
    git_repository_free(repo);
    git_libgit2_shutdown();
    return 0;
}

JSBool updateOrDownloadCommandsRepo(JSContext* cx, JSObject* obj, unsigned int argc, jsval* argv, jsval* rval) {
    unsigned int size = 0;
    unsigned short* jsString = JS_ValueToString(cx, argv[0], &size);
    char* pathName = malloc(size + 1);
    for (int i = 0; i < size; i++) {
        pathName[i] = (char)jsString[i];
    }
    pathName[size] = '\0';
    git_libgit2_init();
    git_repository* repo = NULL;
    const char* url = "https://github.com/ElementsOfJustice/Automation";
    if (git_repository_open_ext(NULL, pathName, GIT_REPOSITORY_OPEN_NO_SEARCH, NULL) == 0) {
        gitPull(pathName);
    }
    else {
        int error = git_clone(&repo, url, pathName, NULL);
    }
    free(pathName);
    git_repository_free(repo);
    git_libgit2_shutdown();
    return JS_TRUE;
}

JSBool commitLocalChange(JSContext* cx, JSObject* obj, unsigned int argc, jsval* argv, jsval* rval) {
    git_repository* repo;
    git_index* index;
    git_oid tree_oid, parent_oid, commit_oid;
    git_tree* tree;
    git_commit* parent;
    git_signature* signature;

    unsigned int size = 0;
    unsigned short* jsString = JS_ValueToString(cx, argv[0], &size);
    char* pathName = malloc(size + 1);
    for (int i = 0; i < size; i++) {
        pathName[i] = (char)jsString[i];
    }
    pathName[size] = '\0';

    git_libgit2_init();

    if (git_repository_open_ext(NULL, pathName, GIT_REPOSITORY_OPEN_NO_SEARCH, NULL) == 0) {
        int error = git_repository_open(&repo, pathName);
        git_repository_index(&index, repo);

        git_index_add_all(index, NULL, 0, NULL, NULL);
        git_index_write(index);

        // Create a tree from the repository's index
        git_index_write_tree(&tree_oid, index);
        git_tree_lookup(&tree, repo, &tree_oid);
        git_reference* head;
        git_reference_lookup(&head, repo, "HEAD");

        // Get the target commit of the reference
        git_reference_peel((git_object**)&parent, head, GIT_OBJECT_COMMIT);

        // Get the OID of the parent commit
        git_oid_cpy(&parent_oid, git_commit_id(parent));

        // Create a signature for the commitx`
        git_signature_default(&signature, repo);

        // Commit the changes to the repository
        time_t rawtime;
        struct tm* timeinfo;
        time(&rawtime);
        timeinfo = localtime(&rawtime);
        git_commit_create_v(&commit_oid, repo, "HEAD", signature, signature,
            NULL, asctime(timeinfo), tree, 1, &parent_oid);
        git_reference_free(head);
        git_signature_free(signature);
        git_commit_free(parent);
        git_tree_free(tree);
        git_index_free(index);
    }
    else {
        // Initialize repository
        git_repository_init(&repo, pathName, 0);
        git_repository_index(&index, repo);

        // Write a file to the repository
        git_index_add_all(index, NULL, 0, NULL, NULL);
        git_index_write(index);

        // Create a tree from the repository's index
        git_index_write_tree(&tree_oid, index);
        git_tree_lookup(&tree, repo, &tree_oid);

        // Create signatures for the author and committer
        git_signature_default(&signature, repo);

        // Create a commit
        git_commit_create_v(&commit_oid, repo, "HEAD", signature, signature, NULL, "Initial Commit", tree, 0, NULL);

        // Clean up resources
        git_signature_free(signature);
        git_tree_free(tree);
        git_index_free(index);
    }
    // Open repository's index

// Clean up resources
    free(pathName);
    git_repository_free(repo);

    git_libgit2_shutdown();
    return JS_TRUE;
}

JSBool renameFolder(JSContext* cx, JSObject* obj, unsigned int argc, jsval* argv, jsval* rval) {
    char* oldPath, * newPath;
    JSObject* args = JS_NewArrayObject(cx, argc, argv);
    jsval arg1, arg2;
    JS_GetElement(cx, args, 0, &arg1);
    JS_GetElement(cx, args, 1, &arg2);
    unsigned int size1 = 0, size2 = 0;
    unsigned short* jsString1 = JS_ValueToString(cx, arg1, &size1);
    unsigned short* jsString2 = JS_ValueToString(cx, arg2, &size2);
    oldPath = malloc((size1 + 1) * sizeof(char));
    newPath = malloc((size2 + 1) * sizeof(char));
    for (int i = 0; i < size1; i++) {
        oldPath[i] = (char)jsString1[i];
    }
    oldPath[size1] = '\0';
    for (int i = 0; i < size2; i++) {
        newPath[i] = (char)jsString2[i];
    }
    newPath[size2] = '\0';
    rename(oldPath, newPath);
    JS_StringToValue(cx, newPath, size2 + 1, rval);
    free(oldPath);
    free(newPath);
    return JS_TRUE;
}

// MM_STATE is a macro that expands to some definitions that are
// needed in order interact with Dreamweaver.  This macro must be
// defined exactly once in your library
MM_STATE


// Flash calls MM_Init when your library is loaded
void
MM_Init()
{
    // sample function
    JS_DefineFunction(_T("getFLACLength"), getFLACLength, 1);
    JS_DefineFunction(_T("stringExample"), stringExample, 1);
    JS_DefineFunction(_T("updateOrDownloadCommandsRepo"), updateOrDownloadCommandsRepo, 1);
    JS_DefineFunction(_T("commitLocalChange"), commitLocalChange, 1);
    JS_DefineFunction(_T("renameFolder"), renameFolder, 2);
}