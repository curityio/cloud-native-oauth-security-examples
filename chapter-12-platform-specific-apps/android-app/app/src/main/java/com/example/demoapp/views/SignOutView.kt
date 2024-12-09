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
import androidx.compose.runtime.Composable
import androidx.compose.ui.res.stringResource
import com.example.demoapp.R
import com.example.demoapp.utilities.CustomButton
import com.example.demoapp.utilities.TextHeading
import com.example.demoapp.utilities.TextParagraph

@Composable
fun SignOutView(onSignOut: () -> Unit) {

    Column {
        TextHeading(stringResource(id = R.string.sign_out_heading))
        TextParagraph(stringResource(id = R.string.sign_out_info))
        CustomButton(stringResource(id = R.string.sign_out_command), onSignOut)
    }
}
