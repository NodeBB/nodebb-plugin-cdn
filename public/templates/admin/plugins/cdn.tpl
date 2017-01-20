<form role="form" class="cdn-settings">
	<div class="row">
		<div class="col-sm-2 col-xs-12 settings-header">General</div>
		<div class="col-sm-10 col-xs-12">
      <div class="checkbox">
				<label class="mdl-switch mdl-js-switch mdl-js-ripple-effect">
					<input class="mdl-switch__input" type="checkbox" id="enabled" />
					<span class="mdl-switch__label"><strong>Enable CDN redirection</strong></span>
				</label>
			</div>
			<div class="mdl-textfield mdl-js-textfield">
        <input class="mdl-textfield__input" type="text" id="url">
        <label class="mdl-textfield__label" for="sample1">https://example.com/</label>
      </div>
      <p>Must restart to apply changes</p>
		</div>
	</div>
</form>

<button id="save" class="floating-button mdl-button mdl-js-button mdl-button--fab mdl-js-ripple-effect mdl-button--colored">
	<i class="material-icons">save</i>
</button>
