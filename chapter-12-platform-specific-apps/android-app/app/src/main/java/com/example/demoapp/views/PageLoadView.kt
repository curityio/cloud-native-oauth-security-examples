/*
 *  Copyright 2024 Curity AB
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */

package com.example.demoapp.views

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.padding
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.unit.dp
import com.example.demoapp.ApplicationError
import com.example.demoapp.CustomColors
import com.example.demoapp.R
import com.example.demoapp.utilities.TextHeading
import com.example.demoapp.utilities.TextOnColor
import com.example.demoapp.utilities.TextParagraph

@Composable
fun PageLoadView(isPageLoaded: Boolean, isLoggedIn: Boolean, pageLoadError: ApplicationError?) {

    @Composable
    fun getLoginStatus(): String {

        return if (!isPageLoaded) {
            stringResource(id = R.string.status_loading)
        } else if (isLoggedIn) {
            stringResource(id = R.string.status_authenticated)
        } else {
            stringResource(id = R.string.status_unauthenticated)
        }
    }

    Column(
        modifier = Modifier
            .padding(bottom = 20.dp)
    ) {
        TextHeading(stringResource(id = R.string.page_load_heading))
        TextParagraph(stringResource(id = R.string.page_load_info))
        TextOnColor(getLoginStatus())
        if (pageLoadError != null) {
            TextOnColor(pageLoadError.toString(), CustomColors.red)
        }
    }
}
