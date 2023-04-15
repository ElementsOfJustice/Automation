#include <git2.h>
#include <stdlib.h>
#include <stdio.h>
#include <string.h>
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
		return nullptr;
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


static void merge_options_init(struct merge_options* opts)
{
	memset(opts, 0, sizeof(*opts));

	opts->heads = NULL;
	opts->heads_count = 0;
	opts->annotated = NULL;
	opts->annotated_count = 0;
}

static int opts_add_refish(struct merge_options* opts, const char* refish)
{
	size_t sz;


	sz = ++opts->heads_count * sizeof(opts->heads[0]);
	opts->heads = (const char**) xrealloc((void*)opts->heads, sz);
	if (opts->heads == nullptr) {
		return -1;
	}
	opts->heads[opts->heads_count - 1] = refish;
	return 0;
}

static int parse_options(const char** repo_path, struct merge_options* opts, int argc, char** argv)
{
	struct args_info args = ARGS_INFO_INIT;

	if (argc <= 1)
		return -1;

	for (args.pos = 1; args.pos < argc; ++args.pos) {
		const char* curr = argv[args.pos];

		if (curr[0] != '-') {
			if (opts_add_refish(opts, curr) != 0) {
				return -1;
			}
		}
		else if (!strcmp(curr, "--no-commit")) {
			opts->no_commit = 1;
		}
		else {
			return -1;
		}
	}
	return 0;
}

static int resolve_heads(git_repository* repo, struct merge_options* opts)
{
	git_annotated_commit** annotated = (git_annotated_commit**) calloc(opts->heads_count, sizeof(git_annotated_commit*));
	size_t annotated_count = 0, i;
	int err = 0;
	if (annotated == NULL) {
		return -1;
	}
	for (i = 0; i < opts->heads_count; i++) {
		err = resolve_refish(&annotated[annotated_count++], repo, opts->heads[i]);
		if (err != 0) {
			//fprintf(stderr, "failed to resolve refish %s: %s\n", opts->heads[i], git_error_last()->message);
			annotated_count--;
			continue;
		}
	}

	if (annotated_count != opts->heads_count) {
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
			return -1;
		}

		symbolic_ref = git_reference_symbolic_target(head_ref);

		err = git_reference_create(&target_ref, repo, symbolic_ref, target_oid, 0, NULL);
		if (err != 0) {
			return -1;
		}

		git_reference_free(head_ref);
	}
	else {
		err = git_repository_head(&target_ref, repo);
		if (err != 0) {
			return -1;
		}
	}

	err = git_object_lookup(&target, repo, target_oid, GIT_OBJECT_COMMIT);
	if (err != 0) {
		return -1;
	}

	ff_checkout_options.checkout_strategy = GIT_CHECKOUT_FORCE;
	err = git_checkout_tree(repo, target, &ff_checkout_options);
	if (err != 0) {
		return -1;
	}

	err = git_reference_set_target(&new_target_ref, target_ref, target_oid, NULL);
	if (err != 0) {
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
	}

	if (err != GIT_ITEROVER) {
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
	git_commit** parents = (git_commit**) calloc(opts->annotated_count + 1, sizeof(git_commit*));
	const char* msg_target = NULL;
	size_t msglen = 0;
	char* msg;
	size_t i;
	int err;
	check_lg2(git_repository_head(&head_ref, repo), "failed to get repo HEAD", NULL);
	if (resolve_refish(&merge_commit, repo, opts->heads[0])) {
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
	msg = (char*) malloc(msglen);
	err = snprintf(msg, msglen, MERGE_COMMIT_MSG, (merge_ref ? "branch" : "commit"), msg_target);

	if (err < 0) goto cleanup;

	err = git_reference_peel((git_object**)&parents[0], head_ref, GIT_OBJECT_COMMIT);
	check_lg2(err, "failed to peel head reference", NULL);
	if (parents == NULL) {
		return -1;
	}
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
	char* argv[2] = { "merge", "origin/main" };
	struct merge_options opts;
	git_index* index;
	int state;
	git_merge_analysis_t analysis;
	git_merge_preference_t preference;
	const char* path = ".";
	int err = 0;

	merge_options_init(&opts);
	if (parse_options(&path, &opts, argc, argv) != 0) {
		return -1;
	}

	state = git_repository_state(repo);
	if (state != GIT_REPOSITORY_STATE_NONE) {
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
		return 0;
	}
	else if (analysis & GIT_MERGE_ANALYSIS_UNBORN ||
		(analysis & GIT_MERGE_ANALYSIS_FASTFORWARD &&
			!(preference & GIT_MERGE_PREFERENCE_NO_FASTFORWARD))) {
		const git_oid* target_oid;
		if (analysis & GIT_MERGE_ANALYSIS_UNBORN) {
		}
		else {
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
	}
cleanup:
	free((char**)opts.heads);
	free(opts.annotated);

	return 0;
}

