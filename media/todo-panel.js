document.addEventListener('DOMContentLoaded', () => {
	const vscode = acquireVsCodeApi();

	const loading = document.getElementById('loading');
	const todosContainer = document.getElementById('todos');

	// Listen for messages from the extension
	window.addEventListener('message', event => {
		const message = event.data;
		
		if (message.type === 'updateTodos') {
			loading.style.display = 'none';
			if (message.content.trim() === '') {
				todosContainer.innerHTML = '<div class="no-todos">No items found</div>';
			} else {
				todosContainer.innerHTML = message.content;

				// Add click handlers to todo items
				const todoItems = document.querySelectorAll('.todo-item');
				todoItems.forEach(item => {
					item.addEventListener('click', () => {
						const message = {
							type: 'todoClick',
							uri: item.getAttribute('data-uri'),
							line: parseInt(item.getAttribute('data-line'))
						};

						vscode.postMessage(message);
					});
				});
			}
		}
	});
});
