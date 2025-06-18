<!--

    Copyright (C) 2025 con terra GmbH (info@conterra.de)

    Licensed under the Apache License, Version 2.0 (the "License");
    you may not use this file except in compliance with the License.
    You may obtain a copy of the License at

            http://www.apache.org/licenses/LICENSE-2.0

    Unless required by applicable law or agreed to in writing, software
    distributed under the License is distributed on an "AS IS" BASIS,
    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
    See the License for the specific language governing permissions and
    limitations under the License.

-->
/*
* Copyright (C) con terra GmbH
*/
<template>
    <div class="ct-executions-pane ct-flex-container ct-flex-column">
        <div class="ct-executions-pane__header padding-default">
            <h4 class="subheading">
                {{ i18n.ui.title }}
            </h4>
            <span class="caption">{{ i18n.ui.subtitle }}</span>
        </div>
        <div class="ct-executions-pane__list">
            <v-list>
                <template
                    v-for="execution in executions"
                >
                    <div
                        v-if="!filteredView || (execution.state==='finished' && execution.count>0)"
                        :key="execution.id"
                    >
                        <v-divider :key="`${execution.id}-divider`" />
                        <v-list-tile
                            :key="`${execution.id}-tile`"
                            :value="execution.id === selectedExecutionId"
                            :inactive="isTileDisabled(execution)"
                            ripple
                            @click="() => tileClicked(execution)"
                        >
                            <v-list-tile-content>
                                <v-list-tile-title>{{ execution.title }}</v-list-tile-title>
                            </v-list-tile-content>
                            <v-list-tile-action>
                                <v-progress-circular
                                    v-if="execution.state === 'pending'"
                                    indeterminate
                                    color="primary"
                                />
                                <icon-tooltip
                                    v-else-if="execution.state === 'failed'"
                                    icon="icon-sign-warning"
                                    color="red"
                                    :tooltip-text="execution.errorMessage || i18n.ui.defaultErrorMessage"
                                />
                                <v-list-tile-action-text
                                    v-else
                                    :class="{'ct-executions-pane__result-count--muted' : execution.count <= 0}"
                                    class="ct-executions-pane__result-count"
                                >
                                    {{ execution.count }}
                                </v-list-tile-action-text>
                            </v-list-tile-action>
                        </v-list-tile>
                    </div>
                </template>
            </v-list>
        </div>
        <div class="ct-executions-pane__footer ct-flex-container ct-flex-justify-between ct-flex-align-center">
            <v-btn
                v-if="pendingExecutions"
                small
                color="secondary"
                class="ml-0"
                @click="abortExecutions"
            >
                {{ i18n.ui.abortExecutions }}
            </v-btn>
            <v-btn
                v-else
                small
                color="secondary"
                class="ml-0"
                @click="clearExecutions()"
            >
                {{ i18n.ui.deleteExecutions }}
            </v-btn>
            <v-tooltip
                v-if="showFilter"
                right
            >
                <v-btn
                    slot="activator"
                    :class="{'filter--active': filteredView}"
                    flat
                    icon
                    :aria-label="i18n.ui.filterTooltip"
                    @click="filteredView=!filteredView"
                >
                    <v-icon>icon-filter</v-icon>
                </v-btn>
                <span>{{ i18n.ui.filterTooltip }}</span>
            </v-tooltip>
        </div>
    </div>
</template>

<script>
    import Bindable from "apprt-vue/mixins/Bindable";
    import IconTooltip from "apprt-vuetify/components/IconTooltip.vue";

    export default {
        name: "executions-pane",
        components: {
            IconTooltip
        },
        mixins: [Bindable],
        data() {
            return {
                selectedExecutionId: undefined,
                showFilterButton: true,
                executions: [],
                filteredView: false,
                i18n: Object
            };
        },
        computed: {
            pendingExecutions() {
                return this.executions.some(
                    execution => execution.state && execution.state === "pending"
                );
            },
            showFilter() {
                if (!this.showFilterButton) {
                    return false;
                }
                return !this.executions.every(
                    execution =>
                        execution.state &&
                        execution.state === "finished" &&
                        execution.count > 0
                );
            }
        },
        methods: {
            tileClicked(execution) {
                if (!this.isTileDisabled(execution)) {
                    this.selectedExecutionId = execution.id;
                    this.$emit("select", execution.id);
                }
            },
            isTileDisabled(execution) {
                return execution.state !== "finished" || execution.count === 0;
            },
            abortExecutions() {
                this.$emit("abort");
            },
            clearExecutions() {
                this.$emit("clear");
            }
        }
    };
</script>
