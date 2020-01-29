const R = require('ramda')
const fn_utils = require('@cr-ste-justine/functional-utils')
const monad_utils = fn_utils.monad

const access_control_utils = require('./access_control')

test('Assert that admin access control works when access should be granted', () => {
    const decodedToken = {
        'realm_access': {
            'roles': ['yes', 'no', 'aktum', 'maybe']
        }
    }
    const is_aktum = access_control_utils.is_admin('aktum')
    expect(
        is_aktum(decodedToken)
    ).toBe(true)
})

test('Assert that admin access control works when access should be denied', () => {
    const decodedToken = {
        'realm_access': {
            'roles': ['yes', 'no', 'maybe']
        }
    }
    const decodedToken2 = {
        'realm_access': {}
    }
    const decodedToken3 = {}
    const is_aktum = access_control_utils.is_admin('aktum')
    
    expect(
        is_aktum(decodedToken)
    ).toBe(false)
    expect(
        is_aktum(decodedToken2)
    ).toBe(false)
    expect(
        is_aktum(decodedToken3)
    ).toBe(false)
})

test('Assert that access control resource processing returns true on happy path', () => {
    const decodedToken = {
        'realm_access': {
            'roles': ['yes', 'no', 'maybe', 'aktum']
        }
    }
    const is_aktum = access_control_utils.is_admin('aktum')
    const get_mock_err = () => "I have an error indeed"
    expect(
        R.compose(
            monad_utils.get_value,
            access_control_utils.process_resource_access(is_aktum, get_mock_err)
        )(decodedToken)
    ).toBe(true)

})

test('Assert that access control processing returns the expected error on failure', () => {
    const decodedToken = {
        'realm_access': {
            'roles': ['yes', 'no', 'maybe']
        }
    }
    const is_aktum = access_control_utils.is_admin('aktum')
    const get_mock_err = () => "I have an error indeed"
    expect(
        R.compose(
            monad_utils.get_value,
            access_control_utils.process_resource_access(is_aktum, get_mock_err)
        )(decodedToken)
    ).toBe("I have an error indeed")
})

test('Assert that access_object works as expected when granting access', () => {
    const decodedToken = {
        'realm_access': {
            'roles': ['yes', 'no', 'aktum']
        },
        'objects': {
            'abc': ['read', 'write']
        }
    }
    const is_aktum = access_control_utils.is_admin('aktum')
    const is_aldoa = access_control_utils.is_admin('aldoa')
    const has_access = R.T
    const has_no_access = R.F

    expect(
        access_control_utils.access_object(
            is_aktum,
            has_no_access
        )({'jwt': decodedToken, 'accessType': 'read', 'object': 'abc'})
    ).toBe(true)

    expect(
        access_control_utils.access_object(
            is_aldoa,
            has_access
        )({'jwt': decodedToken, 'accessType': 'read', 'object': 'abc'})
    ).toBe(true)
})

test('Assert that access_object works as expected when denying access', () => {
    const decodedToken = {
        'realm_access': {
            'roles': ['yes', 'no', 'Aktum']
        },
        'objects': {
            'abc': ['read', 'write']
        }
    }
    const is_aktum = access_control_utils.is_admin('aktum')
    const is_aldoa = access_control_utils.is_admin('aldoa')
    const has_access = R.T
    const has_no_access = R.F

    expect(
        access_control_utils.access_object(
            is_aldoa,
            has_no_access
        )({'jwt': decodedToken, 'accessType': 'read', 'object': 'abc'})
    ).toBe(false)
})