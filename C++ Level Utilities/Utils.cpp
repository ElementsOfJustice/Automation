#include <string>
#include <codecvt>
#include <fstream>
#include "mm_jsapi.h" 
#include <time.h>
#include <shlwapi.h>
#include "git2Stuff.h"
#include <iostream>
#include <sstream>
#include <fstream>
#include <vector>
#include <Windows.h>
#include <thread>
#include <winhttp.h>

#pragma comment(lib, "winmm.lib")  // Link with winmm.lib to use the Windows multimedia functions
#pragma comment(lib, "winhttp.lib")

std::vector<std::string> splitOnQuestionMark(std::string input) {
	std::vector<std::string> substrings;

	size_t startPos = 0;
	size_t endPos = input.find('?');
	while (endPos != std::string::npos) {
		substrings.push_back(input.substr(startPos, endPos - startPos));
		startPos = endPos + 1;
		endPos = input.find('?', startPos);
	}
	substrings.push_back(input.substr(startPos));

	return substrings;
}

wchar_t* stringToWide(const std::string& str) {
	wchar_t* wideStr = new wchar_t[str.size() + 1];
	std::copy(str.begin(), str.end(), wideStr);
	wideStr[str.size()] = L'\0';
	return wideStr;
}

std::string wideToString(wchar_t* wideStr) {
	std::wstring_convert<std::codecvt_utf8<wchar_t>> converter;
	std::wstring wstr(wideStr);
	return converter.to_bytes(wstr);
}

std::string arrToString(std::vector<int> input) {
	std::ostringstream oss;
	for (int i = 0; i < input.size(); i++) {
		oss << static_cast<char>(input[i]);
	}
	return oss.str();
}

#define returnErr(err)\
	auto ret = stringToWide(err);\
	JS_StringToValue(cx, ret, err.size(), rval);\
	delete[] ret;\
	return JS_TRUE

#define setErrMsg(errStr)\
	auto err = giterr_last();\
	if (err != nullptr) {\
		toReturn = errStr + std::string(giterr_last()->message);\
	}\
	else {\
		toReturn = errStr;\
	}

JSBool getFLACLength(JSContext* cx, JSObject* obj, unsigned int argc, jsval* argv, jsval* rval) {
	std::vector<int> inpString;
	for (unsigned int i = 0; i < argc * 2; i += 2) {
		inpString.push_back((argv[i] - 1) / 2);
	}
	std::string filename = arrToString(inpString);
	std::ifstream file(filename, std::ios::binary);
	if (!file.is_open()) {
		*rval = JS_IntegerToValue(-1);
		return JS_TRUE; // return -1 as an error value so that it doesn't crash.
	}
	int c, i, max; // looping variables
	unsigned long sampleRate = 0, samples = 0; // file metadata variables
	for (i = 0, max = 0x20; i < max && (c = file.get()) != EOF; i++) { // loop over first 32 bytes of the file
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
	file.close();

	*rval = JS_IntegerToValue(time); // return the duration of the FLAC file in milliseconds
	// Indicate success
	return JS_TRUE;
}

std::string gitPull(const char* repoPath) {
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
	std::string toReturn = "Successfully pulled.";
	int error = git_remote_lookup(&remote, repo, "origin");
	if (error < 0) {
		const git_error* err = giterr_last();
		toReturn = "Error looking up remote:" + std::to_string(err->klass) + std::string(err->message);
		goto cleanup;
	}

	error = git_remote_fetch(remote, NULL, &fetch_opts, NULL);
	if (error < 0) {
		const git_error* err = giterr_last();
		toReturn = "Error fetching from remote:" + std::to_string(err->klass) + std::string(err->message);
		goto cleanup;
	}

	git_checkout_index(repo, NULL, &checkout_opts);
	if (error < 0) {
		const git_error* err = giterr_last();
		toReturn = "Error checking out index:" + std::to_string(err->klass) + std::string(err->message);
		goto cleanup;
	}

	error = git_repository_head(&head, repo);
	if (error < 0) {
		const git_error* err = giterr_last();
		toReturn = "Error getting HEAD reference:" + std::to_string(err->klass) + std::string(err->message);
		goto cleanup;
	}

	error = git_commit_lookup(&head_commit, repo, git_reference_target(head));
	if (error < 0) {
		const git_error* err = giterr_last();
		toReturn = "Error looking up HEAD commit:" + std::to_string(err->klass) + std::string(err->message);
		goto cleanup;
	}

	error = git_reference_lookup(&remote_head, repo, "refs/remotes/origin/main");
	if (error < 0) {
		const git_error* err = giterr_last();
		toReturn = "Error looking up remote HEAD reference:" + std::to_string(err->klass) + std::string(err->message);
		goto cleanup;
	}

	error = git_commit_lookup(&remote_head_commit, repo, git_reference_target(remote_head));
	if (error < 0) {
		const git_error* err = giterr_last();
		toReturn = "Error looking up remote HEAD commit:" + std::to_string(err->klass) + std::string(err->message);
		goto cleanup;
	}

	error = lg2_merge(repo);
	if (error != 0) {
		const git_error* err = giterr_last();
		toReturn = "Error merging.";
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
	return toReturn;
}

void updateOrDownloadCommandsRepo(std::string pathName) {
	git_libgit2_init();
	git_repository* repo = NULL;
	const char* url = "https://github.com/ElementsOfJustice/Automation";
	std::string toReturn;
	if (git_repository_open_ext(NULL, pathName.c_str(), GIT_REPOSITORY_OPEN_NO_SEARCH, NULL) == 0) {
		toReturn = gitPull(pathName.c_str());
	}
	else {
		toReturn = ((git_clone(&repo, url, pathName.c_str(), NULL)) == 0) ? "Successfully cloned." : "Error cloning.";
	}
	auto ret = stringToWide(toReturn);
	delete[] ret;
	git_repository_free(repo);
	git_libgit2_shutdown();
}

JSBool updateOrDownloadCommandsRepoEntry(JSContext* cx, JSObject* obj, unsigned int argc, jsval* argv, jsval* rval) {
	std::vector<int> inpString;
	for (unsigned int i = 0; i < argc * 2; i += 2) {
		inpString.push_back((argv[i] - 1) / 2);
	}
	std::string pathName = arrToString(inpString), toReturn = "Successfully pulled.";
	std::thread t([pathName]() {
		updateOrDownloadCommandsRepo((std::string)pathName);
		});
	t.detach();
	return JS_TRUE;
}

JSBool renameFolder(JSContext* cx, JSObject* obj, unsigned int argc, jsval* argv, jsval* rval) {
	std::vector<int> inpString;
	for (unsigned int i = 0; i < argc * 2; i += 2) {
		inpString.push_back((argv[i] - 1) / 2);
	}
	std::string toReturn = "Success.";
	std::string oldPath = splitOnQuestionMark(arrToString(inpString))[0], newPath = splitOnQuestionMark(arrToString(inpString))[1];
	int success = rename(oldPath.c_str(), newPath.c_str());
	if (success != 0) {
		toReturn = "Rename failed: " + std::to_string(success) + " " + std::to_string(errno);
	}
	auto ret = stringToWide(toReturn);
	JS_StringToValue(cx, ret, toReturn.size(), rval);
	delete[] ret;
	return JS_TRUE;
}

JSBool commitLocalChange(JSContext* cx, JSObject* obj, unsigned int argc, jsval* argv, jsval* rval) {
	std::vector<int> inpString;
	for (unsigned int i = 0; i < argc * 2; i += 2) {
		inpString.push_back((argv[i] - 1) / 2);
	}
	std::string pathName = arrToString(inpString), toReturn = "Success.";

	if (!PathFileExistsA(pathName.c_str())) { // invalid file path..?
		toReturn = "Invalid path: " + pathName + ", retry.";
		returnErr(toReturn);
	}
	int error = git_libgit2_init();
	if (error != 1) {
		toReturn = "Failed to initialize libgit2.";
		returnErr(toReturn);
	}
	git_repository* repo;
	git_index* index;
	git_oid tree_oid, parent_oid, commit_oid;
	git_tree* tree;
	git_commit* parent;
	git_signature* signature;
	int open_err = git_repository_open_ext(NULL, pathName.c_str(), GIT_REPOSITORY_OPEN_NO_SEARCH, NULL);
	if (open_err == -1) {
		git_libgit2_shutdown();
		setErrMsg("Weird repo corruption? ");
		returnErr(toReturn);
	}
	if (open_err == 0) {
		error = git_repository_open(&repo, pathName.c_str());
		if (error != 0) {
			setErrMsg("Failed to open repository. ");
			git_libgit2_shutdown();
			returnErr(toReturn);
		}
		error = git_repository_index(&index, repo);
		if (error != 0) {
			setErrMsg("Failed to open index. ");
			git_repository_free(repo);
			git_libgit2_shutdown();
			returnErr(toReturn);
		}
		error = git_index_add_all(index, NULL, 0, NULL, NULL);
		if (error != 0) {
			setErrMsg("Failed to add files to index. ");
			git_repository_free(repo);
			git_index_free(index);
			git_libgit2_shutdown();
			returnErr(toReturn);
		}
		error = git_index_write(index);
		if (error != 0) {
			setErrMsg("Failed to write index. ");
			git_repository_free(repo);
			git_index_free(index);
			git_libgit2_shutdown();
			returnErr(toReturn);
		}
		// Create a tree from the repository's index
		error = git_index_write_tree(&tree_oid, index);
		if (error != 0) {
			setErrMsg("Failed to write tree. ");
			git_repository_free(repo);
			git_index_free(index);
			git_libgit2_shutdown();
			returnErr(toReturn);
		}
		error = git_tree_lookup(&tree, repo, &tree_oid);
		if (error != 0) {
			setErrMsg("Failed to look up tree. ");
			git_repository_free(repo);
			git_index_free(index);
			git_libgit2_shutdown();
			returnErr(toReturn);
		}
		git_reference* head;
		error = git_reference_lookup(&head, repo, "HEAD");
		if (error != 0) {
			setErrMsg("Failed to lookup HEAD reference. ");
			git_repository_free(repo);
			git_index_free(index);
			git_tree_free(tree);
			git_libgit2_shutdown();
			returnErr(toReturn);
		}

		// Get the target commit of the reference
		error = git_reference_peel((git_object**)&parent, head, GIT_OBJECT_COMMIT);
		if (error != 0) {
			setErrMsg("Failed to peel reference. ");
			git_repository_free(repo);
			git_index_free(index);
			git_tree_free(tree);
			git_reference_free(head);
			git_libgit2_shutdown();
			returnErr(toReturn);
		}
		// Get the OID of the parent commit (this never returns 0 so I'm not considering positive errors)
		error = git_oid_cpy(&parent_oid, git_commit_id(parent));
		if (error < 0) {
			setErrMsg("Failed to get OID of parent commit. ")
				git_repository_free(repo);
			git_index_free(index);
			git_tree_free(tree);
			git_reference_free(head);
			git_commit_free(parent);
			git_libgit2_shutdown();
			returnErr(toReturn);
		}

		// Create a signature for the commitx`
		error = git_signature_now(&signature, "GigaChad", "GigaChad@westaywinning.com");
		if (error != 0) {
			setErrMsg("Failed to create default signature. ");
			git_repository_free(repo);
			git_index_free(index);
			git_tree_free(tree);
			git_reference_free(head);
			git_commit_free(parent);
			git_libgit2_shutdown();
			returnErr(toReturn);
		}

		// Commit the changes to the repository
		time_t rawtime;
		struct tm* timeinfo;
		time(&rawtime);
		timeinfo = localtime(&rawtime);
		error = git_commit_create_v(&commit_oid, repo, "HEAD", signature, signature,
			NULL, asctime(timeinfo), tree, 1, &parent_oid);
		if (error != 0) {
			setErrMsg("Failed to create commit. ");
			git_repository_free(repo);
			git_index_free(index);
			git_tree_free(tree);
			git_reference_free(head);
			git_commit_free(parent);
			git_signature_free(signature);
			git_libgit2_shutdown();
			returnErr(toReturn);
		}
		git_reference_free(head);
		git_signature_free(signature);
		git_commit_free(parent);
		git_tree_free(tree);
		git_index_free(index);
	}
	else {
		// Initialize repository
		int error = git_repository_init(&repo, pathName.c_str(), 0);
		if (error != 0) {
			setErrMsg("Failed to create repository. ");
			git_libgit2_shutdown();
			returnErr(toReturn);
		}
		error = git_repository_index(&index, repo);
		if (error != 0) {
			setErrMsg("Failed to open index. ");
			git_repository_free(repo);
			git_libgit2_shutdown();
			returnErr(toReturn);
		}

		// Write a file to the repository
		error = git_index_add_all(index, NULL, 0, NULL, NULL);

		if (error != 0) {
			setErrMsg("Failed to add files to index. ");
			git_repository_free(repo);
			git_index_free(index);
			git_libgit2_shutdown();
			returnErr(toReturn);
		}
		error = git_index_write(index);
		if (error != 0) {
			setErrMsg("Failed to write index. ");
			git_repository_free(repo);
			git_index_free(index);
			git_libgit2_shutdown();
			returnErr(toReturn);
		}
		// Create a tree from the repository's index
		error = git_index_write_tree(&tree_oid, index);
		if (error != 0) {
			setErrMsg("Failed to write tree. ");
			git_repository_free(repo);
			git_index_free(index);
			git_libgit2_shutdown();
			returnErr(toReturn);
		}
		error = git_tree_lookup(&tree, repo, &tree_oid);
		if (error != 0) {
			setErrMsg("Failed to look up tree. ");
			git_repository_free(repo);
			git_index_free(index);
			git_libgit2_shutdown();
			returnErr(toReturn);
		}
		// Create signatures for the author and committer
		error = git_signature_now(&signature, "GigaChad", "GigaChad@westaywinning.com");
		if (error != 0) {
			setErrMsg("Failed to create default signature. ");
			git_repository_free(repo);
			git_index_free(index);
			git_tree_free(tree);
			git_libgit2_shutdown();
			returnErr(toReturn);;
		}

		// Create a commit
		error = git_commit_create_v(&commit_oid, repo, "HEAD", signature, signature, NULL, "Initial Commit", tree, 0, NULL);
		if (error != 0) {
			setErrMsg("Failed to create commit. ");
			git_repository_free(repo);
			git_index_free(index);
			git_tree_free(tree);
			git_signature_free(signature);
			git_libgit2_shutdown();
			returnErr(toReturn);
		}
		// Clean up resources
		git_signature_free(signature);
		git_tree_free(tree);
		git_index_free(index);
	}

	// Clean up resources

	auto ret = stringToWide(toReturn);
	JS_StringToValue(cx, ret, toReturn.size(), rval);
	delete[] ret;
	git_repository_free(repo);
	git_libgit2_shutdown();
	return JS_TRUE;
}

JSBool stringExample(JSContext* cx, JSObject* obj, unsigned int argc, jsval* argv, jsval* rval) {
	// AIDS METHOD: because JS_ValueToString causes read access violations, we take each character as its own argument and build a string from that.
	std::vector<int> inpString;
	for (unsigned int i = 0; i < argc * 2; i += 2) {
		inpString.push_back((argv[i] - 1) / 2);
	}
	std::string str = arrToString(inpString);
	JS_StringToValue(cx, stringToWide(str), str.size(), rval);
	return JS_TRUE;

}

JSBool beep(JSContext* cx, JSObject* obj, unsigned int argc, jsval* argv, jsval* rval) {

	long arg1, arg2;

	JS_ValueToInteger(cx, argv[0], &arg1);
	JS_ValueToInteger(cx, argv[2], &arg2);

	std::thread t([arg1, arg2]() {
		Beep((DWORD)arg1, (DWORD)arg2);
		});

	t.detach();

	return JS_TRUE;
}

JSBool playSound(JSContext* cx, JSObject* obj, unsigned int argc, jsval* argv, jsval* rval) {
	// AIDS METHOD: because JS_ValueToString causes read access violations, we take each character as its own argument and build a string from that.
	std::vector<int> inpString;

	for (unsigned int i = 0; i < argc * 2; i += 2) {
		inpString.push_back((argv[i] - 1) / 2);
	}

	std::string str = arrToString(inpString);
	auto wideStr = stringToWide(str);

	std::thread t([wideStr]() {
		PlaySound(wideStr, NULL, SND_FILENAME | SND_ASYNC);
		});

	t.detach();

	return JS_TRUE;
}

JSBool joke(JSContext* cx, JSObject* obj, unsigned int argc, jsval* argv, jsval* rval) {

	// Initialize WinHTTP.
	HINTERNET hSession = WinHttpOpen(L"WinHTTP Example/1.0",
		WINHTTP_ACCESS_TYPE_DEFAULT_PROXY, WINHTTP_NO_PROXY_NAME,
		WINHTTP_NO_PROXY_BYPASS, 0);
	if (!hSession) {
		std::cerr << "WinHttpOpen failed: " << GetLastError() << std::endl;
		return 1;
	}

	// Create an HTTP request.
	HINTERNET hRequest = WinHttpOpenRequest(WinHttpConnect(hSession,
		L"v2.jokeapi.dev", INTERNET_DEFAULT_HTTPS_PORT, 0),
		L"GET", L"/joke/Programming,Miscellaneous,Pun,Spooky?blacklistFlags=nsfw,religious,political,racist,sexist", NULL, WINHTTP_NO_REFERER,
		WINHTTP_DEFAULT_ACCEPT_TYPES, WINHTTP_FLAG_SECURE);
	if (!hRequest) {
		std::cerr << "WinHttpOpenRequest failed: " << GetLastError() << std::endl;
		WinHttpCloseHandle(hSession);
		return 1;
	}

	// Send the HTTP request and receive the response.
	if (!WinHttpSendRequest(hRequest, WINHTTP_NO_ADDITIONAL_HEADERS, 0,
		WINHTTP_NO_REQUEST_DATA, 0, 0, 0) || !WinHttpReceiveResponse(hRequest, NULL)) {
		std::cerr << "WinHttpSendRequest/WinHttpReceiveResponse failed: "
			<< GetLastError() << std::endl;
		WinHttpCloseHandle(hRequest);
		WinHttpCloseHandle(hSession);
		return 1;
	}

	// Read the HTTP response body.
	DWORD dwSize = 0;
	if (!WinHttpQueryDataAvailable(hRequest, &dwSize)) {
		std::cerr << "WinHttpQueryDataAvailable failed: " << GetLastError() << std::endl;
		WinHttpCloseHandle(hRequest);
		WinHttpCloseHandle(hSession);
		return 1;
	}

	//Get a warning here LOL
	char* pszOutBuffer = new char[dwSize + 1];
	ZeroMemory(pszOutBuffer, dwSize + 1);
	DWORD dwDownloaded = 0;
	if (!WinHttpReadData(hRequest, pszOutBuffer, dwSize, &dwDownloaded)) {
		std::cerr << "WinHttpReadData failed: " << GetLastError() << std::endl;
		delete[] pszOutBuffer;
		WinHttpCloseHandle(hRequest);
		WinHttpCloseHandle(hSession);
		return 1;
	}

	// Print the joke.
	std::string str(pszOutBuffer);
	JS_StringToValue(cx, stringToWide(str), str.size(), rval);

	// Clean up.
	delete[] pszOutBuffer;
	WinHttpCloseHandle(hRequest);
	WinHttpCloseHandle(hSession);

	return JS_TRUE;
}



extern "C" {
	// MM_STATE is a macro that expands to some definitions that are
	// needed in order interact with Dreamweaver.  This macro must be
	// defined exactly once in your library
	MM_STATE


		// Flash calls MM_Init when your library is loaded
		void
		MM_Init()
	{
		JS_DefineFunction(L"getFLACLength", getFLACLength, 512);
		JS_DefineFunction(L"updateOrDownloadCommandsRepo", updateOrDownloadCommandsRepoEntry, 512);
		JS_DefineFunction(L"renameFolder", renameFolder, 512);
		JS_DefineFunction(L"stringExample", stringExample, 512);
		JS_DefineFunction(L"commitLocalChange", commitLocalChange, 512);
		JS_DefineFunction(L"beep", beep, 512);
		JS_DefineFunction(L"playSound", playSound, 512);
		JS_DefineFunction(L"joke", joke, 512);
	}
}